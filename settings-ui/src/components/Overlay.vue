<template>
    <div :class="$style.overlay">
        <div :class="$style.overlayPanel">
            <slot/>
        </div>
    </div>
</template>

<script
    lang="ts"
    setup>
    import type { VNode } from 'vue';

    defineSlots<{
        default: VNode;
    }>();
</script>

<style
    lang="scss"
    module>
    .overlay {
        position: fixed;
        display: flex;
        inset: 0;
        padding: 15px;
        overflow: auto;
        overscroll-behavior: contain;
        z-index: 1000;

        &::before {
            position: fixed;
            display: block;
            inset: 0;
            content: '';
            background: rgb(from var(--homey-color-mono-90) r g b / .75);
            z-index: 0;
        }
    }

    .overlayPanel {
        position: relative;
        display: flex;
        padding: 15px;
        margin: auto;
        width: calc(100% - 30px);
        flex-flow: column;
        gap: 15px;
        background: var(--homey-color-mono-0);
        border-radius: var(--homey-border-radius);
        box-shadow: var(--homey-box-shadow);
        z-index: 1;
    }

    // The panel animation lives here so it can reach the mangled class name. The transition
    // classes themselves come from the <Transition> wrapper around this component.
    :global(.overlay-enter-active) .overlayPanel,
    :global(.overlay-leave-active) .overlayPanel {
        transition: 420ms cubic-bezier(0.55, 0, 0.1, 1);
        transition-property: opacity, translate;
    }

    :global(.overlay-enter-from) .overlayPanel,
    :global(.overlay-leave-to) .overlayPanel {
        opacity: 0;
        translate: 0 60px;
    }
</style>
