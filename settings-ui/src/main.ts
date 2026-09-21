import { createApp } from 'vue';
import App from './App.vue';

window.homeyReady.then(() => {
    createApp(App)
        .mount('#app');
});
