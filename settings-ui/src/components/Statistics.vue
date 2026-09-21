<template>
    <FormGroup
        :title="t('settings.statistics.title')"
        :description="t('settings.statistics.description')">
        <div :class="$style.statisticsGrid">
            <Statistic
                icon=""
                :name="t('settings.statistics.cycles')"
                :value="result.numberOfCycles"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.events')"
                :value="result.numberOfEvents"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.flags')"
                :value="result.numberOfFlags"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.labels')"
                :value="result.numberOfLabels"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.modes')"
                :value="result.numberOfModes"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.no_repeats')"
                :value="result.numberOfNoRepeats"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.sets')"
                :value="result.numberOfSets"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.sliders')"
                :value="result.numberOfSliders"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.timers')"
                :value="result.numberOfTimers"/>
        </div>
    </FormGroup>
</template>

<script
    lang="ts"
    setup>
    import { onMounted } from 'vue';
    import { useStatistics, useTranslate } from '../composables';
    import FormGroup from './FormGroup.vue';
    import Statistic from './Statistic.vue';

    const t = useTranslate();
    const {load, result} = useStatistics();

    onMounted(load);
</script>

<style
    lang="scss"
    module>
    .statisticsGrid {
        display: grid;
        gap: 21px 15px;
        grid-template-columns: repeat(2, 1fr);
    }

</style>
