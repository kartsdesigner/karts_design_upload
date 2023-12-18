import { create } from 'zustand';
import { fetchContentful } from '../contentful/contnetful';

export const pageStore = create((set) => ({
    exhibitionPage : true,
    archivePage : true,
    uploadPage : true,
    fetchPageData: async () => {
      try {
        const data = await fetchContentful('pageOnoff');
        set({ exhibitionPage: data[0].fields.exhibitionOnOff});
        set({ archivePage: data[0].fields.archiveOnOff});
        set({ uploadPage: data[0].fields.uploadOnOff});
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    },
  }));