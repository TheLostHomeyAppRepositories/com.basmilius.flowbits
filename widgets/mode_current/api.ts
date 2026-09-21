import type { WidgetApiRequest } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../src/types';

export async function get({homey: {app}, query}: WidgetApiRequest<FlowBitsApp, never, never, Query>): Promise<Result | null> {
    const group = query.group || undefined;
    const modes = await app.api.getModes(group);
    const mode = await app.api.getCurrentMode(group);
    const modeWithLook = modes.find(m => m.name === mode);

    if (!modeWithLook) {
        return null;
    }

    return {
        color: modeWithLook.color,
        icon: modeWithLook.icon,
        name: modeWithLook.name
    };
}

type Query = {
    readonly group?: string;
};

type Result = {
    readonly color: string | undefined;
    readonly icon: string | undefined;
    readonly name: string;
};
