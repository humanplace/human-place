import { MiniKit } from '@worldcoin/minikit-js';

export const haptics = {
  // Color selection feedback
  colorSelect: () => {
    MiniKit.commands.sendHapticFeedback({
      hapticsType: 'selectionChanged'
    });
  },
  
  // Ready to add more methods later...
}; 