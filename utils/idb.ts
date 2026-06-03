
export const saveFileToIDB = async (id: string, data: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SITAMPAN_DOCS', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      store.put(data, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getFileFromIDB = async (id: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SITAMPAN_DOCS', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const getReq = store.get(id);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteFileFromIDB = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SITAMPAN_DOCS', 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveStateToIDB = async (key: string, data: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SITAMPAN_STATE_CACHE', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('states')) {
        db.createObjectStore('states');
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('states', 'readwrite');
      const store = tx.objectStore('states');
      store.put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getStateFromIDB = async (key: string): Promise<any | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SITAMPAN_STATE_CACHE', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('states')) {
        db.createObjectStore('states');
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('states', 'readonly');
      const store = tx.objectStore('states');
      const getReq = store.get(key);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
};
