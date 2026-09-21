import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@trigger('mode_group_deactivated')
export default class extends FlowTriggerEntity<FlowBitsApp, Args, State> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('group', AutocompleteProviders.ModeGroup);
        this.registerAutocomplete('name', AutocompleteProviders.ModeGroupMode);

        await super.onInit();
    }

    async onRun(args: Args, state: State): Promise<boolean> {
        return args.group.name === state.group && args.name.name === state.name;
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
};

type State = {
    readonly group: string;
    readonly name: string;
};
