import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

type Value = {
    readonly group: string;
    readonly name: string;
};

@autocomplete('mode_group_mode')
export default class extends FlowAutocompleteArgumentProvider<FlowBitsApp, Value> {
    async find(query: string, args: Record<string, unknown>): Promise<Homey.FlowCard.ArgumentAutocompleteResults> {
        const hasQuery = query.trim().length > 0;
        const selectedGroup = (args.group as { name?: string } | undefined)?.name;

        // Scope the modes to the selected group, falling back to all modes when no group is chosen yet.
        const scoped = selectedGroup
            ? this.values.filter(value => value.group === selectedGroup)
            : this.values;

        const results: Homey.FlowCard.ArgumentAutocompleteResults = scoped
            .filter(({name}) => !hasQuery || name.toLowerCase().includes(query.toLowerCase()))
            .map(({group, name}) => ({name, group}))
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter((value, index, arr) => arr.findIndex(v => v.name === value.name) === index);

        if (hasQuery && !scoped.some(({name}) => query === name)) {
            results.push({
                name: query,
                description: this.translate('autocomplete.mode_group_mode_new')
            });
        }

        return results;
    }

    /**
     * Returns the modes defined on flow cards, keyed by the group they belong to.
     */
    definedModes(): Map<string, Set<string>> {
        const defined = new Map<string, Set<string>>();

        for (const {group, name} of this.values) {
            const modes = defined.get(group);

            if (modes) {
                modes.add(name);
                continue;
            }

            defined.set(group, new Set([name]));
        }

        return defined;
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('mode_group_activate'),
            this.flow.getActionCard('mode_group_activate_for'),
            this.flow.getActionCard('mode_group_activate_for_revert'),
            this.flow.getActionCard('mode_group_deactivate'),
            this.flow.getActionCard('mode_group_reactivate'),
            this.flow.getActionCard('mode_group_toggle'),
            this.flow.getConditionCard('mode_group_is'),
            this.flow.getConditionCard('mode_group_is_active_for'),
            this.flow.getConditionCard('mode_group_is_inactive_for'),
            this.flow.getTriggerCard('mode_group_activated'),
            this.flow.getTriggerCard('mode_group_changed'),
            this.flow.getTriggerCard('mode_group_deactivated')
        ];
    }

    mapArgument(value: any): Value {
        return {
            group: value.group.name,
            name: value.name.name
        };
    }

    async update(): Promise<void> {
        await super.update();
        await this.app.modes.update();
    }
}
