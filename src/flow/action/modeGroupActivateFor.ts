import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { ClockUnit, FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('mode_group_activate_for')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('group', AutocompleteProviders.ModeGroup);
        this.registerAutocomplete('name', AutocompleteProviders.ModeGroupMode);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.modes.activateFor(args.group.name, args.name.name, args.duration, args.unit);
    }

    async onUpdate(): Promise<void> {
        await this.app.modes.update();
        await super.onUpdate();
    }
}

type Args = {
    readonly group: {
        readonly name: string;
    };
    readonly name: {
        readonly name: string;
    };
    readonly duration: number;
    readonly unit: ClockUnit;
};
