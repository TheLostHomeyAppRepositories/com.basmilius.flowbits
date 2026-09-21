import { action, FlowActionEntity } from '@basmilius/homey-common';
import { DEFAULT_MODE_GROUP } from '../../const';
import type { FlowBitsApp } from '../../types';

@action('mode_reactivate_current')
export default class extends FlowActionEntity<FlowBitsApp> {
    async onRun(): Promise<void> {
        await this.app.modes.reactivateCurrent(DEFAULT_MODE_GROUP);
    }

    async onUpdate(): Promise<void> {
        await this.app.modes.update();
        await super.onUpdate();
    }
}
