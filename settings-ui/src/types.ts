export type {
    BitSet,
    BitSetState,
    ClockState,
    ClockUnit,
    Cycle,
    Event,
    Flag,
    Label,
    Look,
    Mode,
    ModeGroup,
    NoRepeatWindow,
    Slider,
    Statistics,
    Timer
} from '../../src/types';

export type FeatureType =
    | 'event'
    | 'flag'
    | 'label'
    | 'mode'
    | 'set'
    | 'timer';

export type FormLook = {
    readonly color: string;
    readonly icon: string;
};

export type Item = {
    name: string;
    color: string | undefined;
    icon: string | undefined;

    /** Secondary label shown at the end of the row. Modes use it for their group. */
    caption?: string;
};
