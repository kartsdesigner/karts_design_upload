import { create } from 'zustand';
import { fetchContentful } from '../contentful/contnetful';

export const pageStore = create((set) => ({
    uploadPage : true,
    fetchPageData: async () => {
      try {
        const data = await fetchContentful('pageOnoff');
        set({ uploadPage: data[0].fields.uploadOnOff});
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    },
  }));