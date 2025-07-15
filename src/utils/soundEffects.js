class SoundManager {
    constructor() {
      this.sounds = {};
      this.enabled = true;
      this.volume = 0.3;
      this.initialized = false;
    }
  
    // 预加载音效
    preloadSounds() {
      const soundFiles = {
        dog: '/sounds/bark.mp3',
        cat: '/sounds/meow.mp3',
        click: '/sounds/cute-click.mp3',
        heart: '/sounds/heart-beat.mp3'
      };
  
      Object.keys(soundFiles).forEach(key => {
        this.sounds[key] = new Audio(soundFiles[key]);
        this.sounds[key].volume = this.volume;
        this.sounds[key].preload = 'auto';
        
        // 添加错误处理
        this.sounds[key].onerror = (e) => {
          console.warn(`音频文件加载失败: ${soundFiles[key]}`);
        };
      });
      
      this.initialized = true;
    }
  
    // 播放音效
    async play(soundName) {
      if (!this.enabled || !this.initialized) return;
      
      const sound = this.sounds[soundName];
      if (sound) {
        try {
          sound.currentTime = 0;
          await sound.play();
        } catch (error) {
          console.warn(`音效播放失败: ${soundName}`, error);
          // 如果音频文件失败，尝试生成音效
          this.generateFallbackSound(soundName);
        }
      } else {
        // 如果没有音频文件，生成音效
        this.generateFallbackSound(soundName);
      }
    }
    
    // 生成备用音效
    generateFallbackSound(soundName) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 根据音效类型设置不同的频率
        const soundConfigs = {
          dog: { freq: 300, duration: 0.2 },
          cat: { freq: 600, duration: 0.15 },
          click: { freq: 800, duration: 0.1 },
          heart: { freq: 400, duration: 0.3 }
        };
        
        const config = soundConfigs[soundName] || soundConfigs.click;
        
        oscillator.frequency.setValueAtTime(config.freq, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(config.freq * 0.3, audioContext.currentTime + config.duration);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + config.duration);
      } catch (error) {
        console.warn('备用音效生成失败:', error);
      }
    }
  
    // 设置音量
    setVolume(volume) {
      this.volume = Math.max(0, Math.min(1, volume));
      Object.values(this.sounds).forEach(sound => {
        sound.volume = this.volume;
      });
    }
  
    // 开启/关闭音效
    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }
  }
  
  // 创建全局音效管理器实例
  const soundManager = new SoundManager();
  
  // 用户首次交互时初始化音效
  let userInteracted = false;
  const initializeOnFirstInteraction = () => {
    if (!userInteracted) {
      userInteracted = true;
      soundManager.preloadSounds();
      console.log('音效系统已初始化');
    }
  };
  
  // 监听用户交互
  if (typeof window !== 'undefined') {
    ['click', 'touchstart', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, initializeOnFirstInteraction, { once: true });
    });
  }
  
  // 导出的函数
  export const playPetSound = (petType) => {
    const soundMap = {
        dog: 'dog',
        cat: 'cat',
        default: 'click'
      };
    
      const soundName = soundMap[petType?.toLowerCase()] || soundMap.default;
    soundManager.play(soundName);
  };
  
  export const playHeartSound = () => {
    soundManager.play('heart');
  };
  
  export const playClickSound = () => {
    soundManager.play('click');
  };
  
  // 音效设置函数
  export const setSoundVolume = (volume) => {
    soundManager.setVolume(volume);
  };
  
  export const toggleSound = () => {
    return soundManager.toggle();
  };
  
  export const isSoundEnabled = () => {
    return soundManager.enabled;
  };
  
  // 手动初始化音效（用于测试）
  export const initializeSounds = () => {
    soundManager.preloadSounds();
  };