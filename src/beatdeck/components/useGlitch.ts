import { useSyncExternalStore } from 'react';
import { glitch } from '../fx/glitch';

export const useGlitch = () => useSyncExternalStore(glitch.subscribe, glitch.get);
