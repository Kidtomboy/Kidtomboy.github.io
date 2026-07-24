// Lớp trừu tượng hóa IndexedDB và LocalStorage
class StorageManager {
  constructor() {
    this.dbName = 'kidtomboyDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('todo')) {
          db.createObjectStore('todo', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('gameScores')) {
          db.createObjectStore('gameScores', { keyPath: 'gameName' });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = reject;
    });
  }

  async add(storeName, data) {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = reject;
    });
  }

  async getAll(storeName) {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = reject;
    });
  }
}

export const storage = new StorageManager();