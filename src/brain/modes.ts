import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { MAX_TIMEOUT_MS, REALTIME_MODE_UPDATE, SETTING_MODE, SETTING_MODE_EXPIRES_AT, SETTING_MODE_LAST_UPDATES, SETTING_MODE_LOOKS, SETTING_MODE_REVERT_TO } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockUnit, Feature, FlowBitsApp, Look, Mode, Styleable } from '../types';
import { convertDurationToMs } from '../util';

export default class Modes extends Shortcuts<FlowBitsApp> implements Feature<Mode>, Styleable {
    #expirationTimeout: NodeJS.Timeout | null = null;

    get currentMode(): string | null {
        return this.settings.get(SETTING_MODE);
    }

    set currentMode(value: string | null) {
        this.settings.set(SETTING_MODE, value);
    }

    get expiresAt(): DateTime | null {
        const value = this.settings.get(SETTING_MODE_EXPIRES_AT);

        return value ? DateTime.fromISO(value) : null;
    }

    set expiresAt(value: DateTime | null) {
        this.settings.set(SETTING_MODE_EXPIRES_AT, value?.toISO() ?? null);
    }

    get revertTo(): string | null {
        return this.settings.get(SETTING_MODE_REVERT_TO) ?? null;
    }

    set revertTo(value: string | null) {
        this.settings.set(SETTING_MODE_REVERT_TO, value);
    }

    get looks(): Record<string, Look> {
        return this.settings.get(SETTING_MODE_LOOKS) ?? {};
    }

    set looks(value: Record<string, Look>) {
        this.settings.set(SETTING_MODE_LOOKS, value);
    }

    get lastUpdates(): Record<string, DateTime> {
        return Object.fromEntries(
            Object.entries<string>(this.settings.get(SETTING_MODE_LAST_UPDATES) ?? {})
                .map(([key, value]) => [
                    key,
                    DateTime.fromISO(value)
                ])
        );
    }

    set lastUpdates(value: Record<string, DateTime>) {
        this.settings.set(SETTING_MODE_LAST_UPDATES, Object.fromEntries(
            Object.entries(value)
                .map(([key, value]) => [
                    key,
                    value.toISO()
                ])
        ));
    }

    async initialize(): Promise<void> {
        await this.#scheduleExpiration();
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused modes...');

        const defined = await this.findAll();
        const looks = this.looks;
        const lastUpdates = this.lastUpdates;

        if (this.currentMode && !defined.find(d => d.name === this.currentMode)) {
            this.currentMode = null;
            this.expiresAt = null;
            this.revertTo = null;
        }

        if (this.revertTo && !defined.find(d => d.name === this.revertTo)) {
            this.revertTo = null;
        }

        for (const key of Object.keys(this.looks)) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused mode look ${key}...`);
            delete looks[key];
        }

        for (const key of Object.keys(this.lastUpdates)) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused mode last update ${key}...`);
            delete lastUpdates[key];
        }

        this.looks = looks;
        this.lastUpdates = lastUpdates;

        await this.#scheduleExpiration();
    }

    async count(): Promise<number> {
        const modes = await this.findAll();

        return modes.length;
    }

    async find(name: string): Promise<Mode | null> {
        const modes = await this.findAll();
        const mode = modes.find(mode => mode.name === name);

        return mode ?? null;
    }

    async findAll(): Promise<Mode[]> {
        const provider = this.#autocompleteProvider();
        const current = this.currentMode;
        const lastUpdates = this.lastUpdates;
        const modes = await provider.find('');

        if (modes.length === 0) {
            return [];
        }

        return modes.map(mode => {
            const look = this.getLook(mode.name);
            const lastUpdate = lastUpdates[mode.name];

            return {
                active: current === mode.name,
                color: look[0],
                icon: look[1],
                lastUpdate: lastUpdate?.toISO() ?? undefined,
                name: mode.name
            };
        });
    }

    async activate(name: string): Promise<void> {
        const current = this.currentMode;

        if (!name) {
            return;
        }

        // An open-ended activation cancels any pending timed deactivation or revert.
        this.#clearExpiration();

        if (current === name) {
            return;
        }

        this.currentMode = name;

        const now = DateTime.now();
        const updates = {...this.lastUpdates, [name]: now};

        // Also update the timestamp for the previously active mode
        if (current !== null) {
            updates[current] = now;
        }

        this.lastUpdates = updates;

        this.log(`Activate mode ${name}.`);

        // Emit the UI update first so widgets reflect the switch immediately,
        // instead of waiting on the (potentially slow) timeline notifications below.
        await this.#triggerRealtime();

        if (current !== null) {
            await this.#triggerDeactivated(current);
        }

        await Promise.allSettled([
            this.#triggerActivated(name),
            this.#triggerChanged(name, true)
        ]);
    }

    async deactivate(name: string): Promise<void> {
        const current = this.currentMode;

        if (!name || current !== name) {
            return;
        }

        this.#clearExpiration();

        this.currentMode = null;
        this.lastUpdates = {
            ...this.lastUpdates,
            [name]: DateTime.now()
        };

        this.log(`Deactivate mode ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerDeactivated(name),
            this.#triggerChanged(name, false)
        ]);
    }

    async reactivate(name: string): Promise<void> {
        if (!name) {
            return;
        }

        this.#clearExpiration();

        this.currentMode = name;
        this.lastUpdates = {
            ...this.lastUpdates,
            [name]: DateTime.now()
        };

        this.log(`Reactivate mode ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerActivated(name),
            this.#triggerChanged(name, true)
        ]);
    }

    async reactivateCurrent(): Promise<void> {
        const current = this.currentMode;

        if (current === null) {
            this.log('No current mode to reactivate.');
            return;
        }

        await this.reactivate(current);
    }

    async toggle(name: string): Promise<void> {
        if (this.currentMode === name) {
            await this.deactivate(name);
        } else {
            await this.activate(name);
        }
    }

    async activateFor(name: string, duration: number, unit: ClockUnit): Promise<void> {
        if (!name) {
            return;
        }

        // Activate the mode (clears any previous expiration/revert)
        await this.activate(name);

        // Schedule plain deactivation; no mode is restored afterwards.
        this.expiresAt = DateTime.now().plus({milliseconds: convertDurationToMs(duration, unit)});
        this.revertTo = null;

        await this.#scheduleExpiration();

        this.log(`Activated mode ${name} for ${duration} ${unit}.`);
    }

    async activateForRevert(name: string, duration: number, unit: ClockUnit): Promise<void> {
        if (!name) {
            return;
        }

        // Remember the mode that was active before switching, so it can be restored.
        const previous = this.currentMode;

        // Activate the mode (clears any previous expiration/revert)
        await this.activate(name);

        if (previous === name) {
            this.log(`Mode ${name} was already active, so there is nothing to revert to.`);
            return;
        }

        this.expiresAt = DateTime.now().plus({milliseconds: convertDurationToMs(duration, unit)});
        this.revertTo = previous;

        await this.#scheduleExpiration();

        this.log(`Activated mode ${name} for ${duration} ${unit}, reverting to ${previous ?? 'no mode'} afterwards.`);
    }

    async isActiveFor(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.lastUpdates[name];

        if (!lastUpdate) {
            return false;
        }

        const isActive = this.currentMode === name;

        if (!isActive) {
            return false;
        }

        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return lastUpdate <= cutoff;
    }

    async isInactiveFor(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.lastUpdates[name];

        if (!lastUpdate) {
            // If there's no lastUpdate, the mode has never been touched, so consider it inactive forever
            return true;
        }

        const isActive = this.currentMode === name;

        if (isActive) {
            return false;
        }

        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return lastUpdate <= cutoff;
    }

    getLook(name: string): Look {
        return this.looks[name] ?? ['#204ef6', ''];
    }

    async setLook(name: string, look: Look): Promise<void> {
        this.looks = {
            ...this.looks,
            [name]: look
        };

        await this.#triggerRealtime();
    }

    async update(): Promise<void> {
        await this.#triggerRealtime();
    }

    #clearExpiration(): void {
        if (this.#expirationTimeout) {
            this.clearTimeout(this.#expirationTimeout);
            this.#expirationTimeout = null;
        }

        if (this.expiresAt !== null) {
            this.expiresAt = null;
        }

        if (this.revertTo !== null) {
            this.revertTo = null;
        }
    }

    async #scheduleExpiration(): Promise<void> {
        if (this.#expirationTimeout) {
            this.clearTimeout(this.#expirationTimeout);
            this.#expirationTimeout = null;
        }

        const current = this.currentMode;
        const expiresAt = this.expiresAt;

        if (!current || !expiresAt) {
            return;
        }

        const diff = expiresAt.diff(DateTime.now()).as('milliseconds');

        if (diff <= 0) {
            await this.#processExpiration();
            return;
        }

        const delay = Math.min(diff, MAX_TIMEOUT_MS);

        this.#expirationTimeout = this.setTimeout(async () => {
            this.#expirationTimeout = null;
            await this.#processExpiration();
        }, delay);

        this.log(`Scheduled mode expiration check in ${Math.round(delay / 1000)}s.`);
    }

    async #processExpiration(): Promise<void> {
        const current = this.currentMode;
        const expiresAt = this.expiresAt;

        if (!current || !expiresAt) {
            return;
        }

        // Safety net: the timeout may have fired early due to the MAX_TIMEOUT_MS cap.
        if (expiresAt > DateTime.now()) {
            await this.#scheduleExpiration();
            return;
        }

        const revertTo = this.revertTo;

        if (revertTo) {
            // Restore the previously active mode instead of leaving no mode active.
            await this.activate(revertTo);
        } else {
            await this.deactivate(current);
        }
    }

    async #triggerActivated(name: string): Promise<void> {
        await this.registry.fireTrigger(Triggers.ModeActivated, {name});
        await this.notify(this.translate('notification.mode_activated', {name}));
    }

    async #triggerChanged(name: string, active: boolean): Promise<void> {
        await this.registry.fireTrigger(Triggers.ModeCurrentChanged, {}, {mode: active ? name : '-'});
        await this.registry.fireTrigger(Triggers.ModeChanged, {name}, {active});
    }

    async #triggerDeactivated(name: string): Promise<void> {
        await this.registry.fireTrigger(Triggers.ModeDeactivated, {name});
        await this.notify(this.translate('notification.mode_deactivated', {name}));
    }

    async #triggerRealtime(): Promise<void> {
        this.realtime(REALTIME_MODE_UPDATE);
    }

    #autocompleteProvider(): AutocompleteProviders.Mode {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Mode);

        if (!provider) {
            throw new Error('Failed to get the mode autocomplete provider.');
        }

        return provider;
    }
}
