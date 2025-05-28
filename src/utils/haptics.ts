import { MiniKit } from '@worldcoin/minikit-js';

export const haptics = {
  // Color selection feedback
  colorSelect: () => {
    MiniKit.commands.sendHapticFeedback({
      hapticsType: 'selection-changed'
    });
  },
  
  // Pixel preview feedback (light touch)
  pixelPreview: () => {
    MiniKit.commands.sendHapticFeedback({
      hapticsType: 'impact',
      style: 'light'
    });
  },
  
  // Button press feedback (light touch)
  buttonPress: () => {
    MiniKit.commands.sendHapticFeedback({
      hapticsType: 'impact',
      style: 'light'
    });
  },
  
  // Ready to add more methods later...
}; 