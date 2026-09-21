import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@trigger('mode_group_current_changed')
export default class extends FlowTriggerEntity<FlowBitsApp, Args, State, Tokens> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('group', AutocompleteProviders.ModeGroup);

        await super.onInit();
    }

    async onRun(args: Args, state: State): Promise<boolean> {
        return args.group.name === state.group;
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

type State = {
    readonly group: string;
};

type Tokens = {
    readonly mode: string;
};
