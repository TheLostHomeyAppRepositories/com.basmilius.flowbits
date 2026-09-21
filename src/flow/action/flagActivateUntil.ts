import { action, DateTime, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('flag_activate_until')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('flag', AutocompleteProviders.Flag);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        // Homey hands both args over as ISO parts; Luxon resolves them in the Homey timezone.
        const expiresAt = DateTime.fromISO(`${args.date}T${args.time}`);

        if (!expiresAt.isValid) {
            this.log(`Could not parse date "${args.date}" and time "${args.time}" for flag ${args.flag.name}.`);
            return;
        }

        await this.app.flags.activateUntil(args.flag.name, expiresAt);
    }

    async onUpdate(): Promise<void> {
        await this.app.flags.update();
        await super.onUpdate();
    }
}

type Args = {
    readonly date: string;
    readonly flag: {
        readonly name: string;
    };
    readonly time: string;
};
