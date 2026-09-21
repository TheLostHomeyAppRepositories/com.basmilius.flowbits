import type { WidgetApiRequest } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../src/types';

export async function list({homey: {app}, query}: WidgetApiRequest<FlowBitsApp, never, never, Query>): Promise<Mode[]> {
    return await app.api.getModes(query.group || undefined);
}

export async function toggle({homey: {app}, body}: WidgetApiRequest<FlowBitsApp, Body>): Promise<boolean> {
    return await app.api.toggleMode(body.mode, body.group || undefined);
}

type Mode = {
    readonly active: boolean;
    readonly name: string;
};

type Query = {
    readonly group?: string;
};

type Body = {
    readonly mode: string;
    readonly group?: string;
};
