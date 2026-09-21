import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@condition('mode_group_active')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('group', AutocompleteProviders.ModeGroup);

        await super.onInit();
    }

    async onRun(args: Args): Promise<boolean> {
        return this.app.modes.currentModeIn(args.group.name) !== null;
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
};
