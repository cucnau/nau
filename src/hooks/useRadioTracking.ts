import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { RadioManager } from '../lib/radioManager';

export function useRadioTracking() {
  const { uid, isMaintenance } = useStore();
  const lastState = useRef({
    isPlaying: false,
    activeTrackId: '',
  });

  useEffect(() => {
    if (!uid || isMaintenance) return;

    let intervalId: any;

    const unsub = RadioManager.subscribe(() => {
      const state = useStore.getState();
      const currentTrackId = RadioManager.activeTrackId;
      const isPlaying = RadioManager.isPlaying;

      const prev = lastState.current;

      // Track switches
      if (currentTrackId !== prev.activeTrackId && prev.activeTrackId !== '') {
         // Switched track
         const switches = (state.radioTrackSwitches || 0) + 1;
         
         const updates: any = { radioTrackSwitches: switches };
         state.updateUserDoc(updates, 'Choco Tìm Kiếm track switch');
         state._triggerCountAchievementsCheck();
      }

      // Track universe exploration
      if (currentTrackId) {
         let heard = state.heardRadioTracks || [];
         if (!heard.includes(currentTrackId)) {
            heard = [...heard, currentTrackId];
            state.updateUserDoc({ heardRadioTracks: heard }, 'Vũ trụ âm thanh');
            state._triggerCountAchievementsCheck();
         }
      }

      // If playing changed
      if (isPlaying !== prev.isPlaying || currentTrackId !== prev.activeTrackId) {
        // Handle stop/start intervals
        if (!isPlaying) {
           if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
           }
        }
      }

      // Reset track seconds if track changed
      if (currentTrackId !== prev.activeTrackId) {
         // Reset consecutive track seconds locally in db?
         // Actually, if we changed track, our current consecutive seconds drops to 0 for the NEW track.
         // We can just keep a local variable for the *current* track's seconds.
         useStore.setState({ radioTrackSeconds: 0 }); 
         state.updateUserDoc({ radioTrackSeconds: 0 }); // reset in db? Or maybe just keep tracking max.
         // Yes, we just update maxRadioTrackSeconds.
      }

      lastState.current = { isPlaying, activeTrackId: currentTrackId };
    });

    // Tick every 5 seconds to minimize writes
    const TICK_S = 5;
    intervalId = setInterval(() => {
       if (!RadioManager.isPlaying || !lastState.current.activeTrackId) return;

       const state = useStore.getState();
       const updates: any = {};

       // Update one track love
       const currentTrackSec = (state.radioTrackSeconds || 0) + TICK_S;
       updates.radioTrackSeconds = currentTrackSec;
       
       const maxTrackSec = Math.max(state.maxRadioTrackSeconds || 0, currentTrackSec);
       if (maxTrackSec > (state.maxRadioTrackSeconds || 0)) {
           updates.maxRadioTrackSeconds = maxTrackSec;
       }

       // Update night chill 
       // Khung giờ 11:00 tối đến 5:00 sáng -> 23:00 to 05:00
       const hour = new Date().getHours();
       if (hour >= 23 || hour < 5) {
           updates.radioNightChillSeconds = (state.radioNightChillSeconds || 0) + TICK_S;
       } else {
           // If outside the timezone, does it break streak? "trong 30 phút liên tục trong khung giờ" -> yes, reset if outside
           if ((state.radioNightChillSeconds || 0) > 0) {
               updates.radioNightChillSeconds = 0;
           }
       }

       if (Object.keys(updates).length > 0) {
          state.updateUserDoc(updates);
          state._triggerCountAchievementsCheck();
       }
    }, TICK_S * 1000);

    return () => {
      unsub();
      if (intervalId) clearInterval(intervalId);
    };
  }, [uid, isMaintenance]);
}
