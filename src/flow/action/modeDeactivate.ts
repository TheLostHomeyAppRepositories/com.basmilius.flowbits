import { action, FlowActionEntity } from '@basmilius/homey-common';
import { DEFAULT_MODE_GROUP } from '../../const';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('mode_deactivate')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('name', AutocompleteProviders.Mode);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.modes.deactivate(DEFAULT_MODE_GROUP, args.name.name);
    }

    async onUpdate(): Promise<void> {
        await this.app.modes.update();
        await super.onUpdate();
    }
}

type Args = {
    readonly name: {
        readonly name: string;
    };
};
