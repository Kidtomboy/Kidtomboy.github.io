/**
 * Quản lý cheat cho tất cả game.
 * Chỉ hoạt động khi Dev Mode được kích hoạt (xem devMode.js).
 */
import { isDevMode } from './devMode.js';

class CheatManager {
  constructor() {
    this.cheats = {};
    this.listeners = [];
  }

  // Đăng ký một cheat
  register(name, defaultValue, onChange) {
    if (!isDevMode()) return;
    this.cheats[name] = defaultValue;
    if (onChange) this.listeners.push({ name, callback: onChange });
  }

  // Lấy giá trị cheat
  get(name) {
    return isDevMode() ? this.cheats[name] : undefined;
  }

  // Bật/tắt cheat boolean
  toggle(name) {
    if (!isDevMode()) return;
    if (typeof this.cheats[name] === 'boolean') {
      this.cheats[name] = !this.cheats[name];
      this._notify(name);
    }
  }

  // Đặt giá trị cheat
  set(name, value) {
    if (!isDevMode()) return;
    this.cheats[name] = value;
    this._notify(name);
  }

  _notify(name) {
    this.listeners
      .filter(l => l.name === name)
      .forEach(l => l.callback(this.cheats[name]));
  }

  // Kiểm tra cheat có được bật không
  isActive(name) {
    return isDevMode() && !!this.cheats[name];
  }
}

export const cheatManager = new CheatManager();