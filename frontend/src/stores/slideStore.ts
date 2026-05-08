import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Slide, Style, ImageInfo, ProjectSummary } from "@/types";
import { slidesApi } from "@/api/slides";
import { imagesApi } from "@/api/images";
import { ApiError } from "@/api";

interface SlideState {
  // Project list
  projects: ProjectSummary[];
  isLoadingProjects: boolean;

  // Current project
  slug: string | null;
  title: string;
  style: Style | null;
  isStyleModalOpen: boolean;
  slides: Slide[];
  selectedSlideId: string | null;
  selectedImageFilename: string | null;
  currentImages: ImageInfo[];
  isLoading: boolean;
  isGenerating: boolean;
  cost: number;

  // Actions
  loadProjects: () => Promise<void>;
  exitProject: () => void;
  loadProject: (slug: string) => Promise<void>;
  selectSlide: (sid: string) => Promise<void>;
  createSlide: (content: string, position?: number) => Promise<void>;
  updateSlide: (sid: string, content: string) => Promise<void>;
  deleteSlide: (sid: string) => Promise<void>;
  reorderSlides: (slideIds: string[]) => Promise<void>;
  updateTitle: (title: string) => Promise<void>;
  generateImage: (sid: string) => Promise<void>;
  loadSlideImages: (sid: string) => Promise<void>;
  selectImage: (filename: string) => void;
  setStyle: (style: Style) => void;
  openStyleModal: () => void;
  closeStyleModal: () => void;
  editingSlideId: string | null;
  openEditModal: (sid: string) => void;
  closeEditModal: () => void;
}

export const useSlideStore = create<SlideState>()(
  immer((set, get) => ({
    projects: [],
    isLoadingProjects: false,
    slug: null,
    title: "",
    style: null,
    isStyleModalOpen: false,
    editingSlideId: null,
    slides: [],
    selectedSlideId: null,
    selectedImageFilename: null,
    currentImages: [],
    isLoading: false,
    isGenerating: false,
    cost: 0,

    loadProjects: async () => {
      set((s) => {
        s.isLoadingProjects = true;
      });
      try {
        const projects = await slidesApi.listProjects();
        set((s) => {
          s.projects = projects;
          s.isLoadingProjects = false;
        });
      } catch {
        set((s) => {
          s.isLoadingProjects = false;
        });
      }
    },

    exitProject: () => {
      set((s) => {
        s.slug = null;
        s.title = "";
        s.style = null;
        s.isStyleModalOpen = false;
        s.editingSlideId = null;
        s.slides = [];
        s.selectedSlideId = null;
        s.selectedImageFilename = null;
        s.currentImages = [];
        s.cost = 0;
      });
    },

    loadProject: async (slug: string) => {
      set((s) => {
        s.isLoading = true;
      });
      try {
        const project = await slidesApi.getProject(slug);
        set((s) => {
          s.slug = slug;
          s.title = project.title;
          s.style = project.style;
          s.slides = project.slides;
          s.isLoading = false;
        });
        if (project.slides.length > 0) {
          const firstSid = project.slides[0]!.sid;
          await get().selectSlide(firstSid);
        }
      } catch (err: unknown) {
        // If project doesn't exist (404), initialize an empty project state
        if (err instanceof ApiError && err.status === 404) {
          set((s) => {
            s.slug = slug;
            s.title = slug;
            s.style = null;
            s.slides = [];
            s.selectedSlideId = null;
            s.currentImages = [];
            s.isLoading = false;
          });
        } else {
          set((s) => {
            s.isLoading = false;
          });
          throw err;
        }
      }
    },

    selectSlide: async (sid: string) => {
      set((s) => {
        s.selectedSlideId = sid;
        s.selectedImageFilename = null;
        s.currentImages = [];
      });
      await get().loadSlideImages(sid);
    },

    createSlide: async (content: string, position?: number) => {
      const { slug } = get();
      if (!slug) return;
      const slide = await slidesApi.createSlide(slug, { content, position });
      set((s) => {
        if (position !== undefined) {
          s.slides.splice(position, 0, slide);
        } else {
          s.slides.push(slide);
        }
      });
      await get().selectSlide(slide.sid);
    },

    updateSlide: async (sid: string, content: string) => {
      const { slug } = get();
      if (!slug) return;
      const updated = await slidesApi.updateSlide(slug, sid, { content });
      set((s) => {
        const idx = s.slides.findIndex((sl) => sl.sid === sid);
        if (idx !== -1) {
          s.slides[idx] = updated;
        }
      });
      if (get().selectedSlideId === sid) {
        await get().loadSlideImages(sid);
      }
    },

    deleteSlide: async (sid: string) => {
      const { slug } = get();
      if (!slug) return;
      const slides = get().slides;
      const idx = slides.findIndex((s) => s.sid === sid);
      if (idx === -1) return;

      await slidesApi.deleteSlide(slug, sid);
      set((s) => {
        s.slides = s.slides.filter((sl) => sl.sid !== sid);
        if (s.selectedSlideId === sid) {
          const nextIdx = Math.min(idx, s.slides.length - 1);
          s.selectedSlideId =
            s.slides.length > 0 ? s.slides[nextIdx]!.sid : null;
        }
      });
    },

    reorderSlides: async (slideIds: string[]) => {
      const { slug } = get();
      if (!slug) return;
      const previous = get().slides;
      set((s) => {
        const slideMap = new Map(s.slides.map((sl) => [sl.sid, sl]));
        s.slides = slideIds
          .map((id) => slideMap.get(id))
          .filter((sl): sl is Slide => sl !== undefined);
      });
      try {
        await slidesApi.reorderSlides(slug, slideIds);
      } catch {
        set((s) => {
          s.slides = previous;
        });
      }
    },

    updateTitle: async (title: string) => {
      const { slug } = get();
      if (!slug) return;
      set((s) => {
        s.title = title;
      });
      try {
        await slidesApi.updateTitle(slug, title);
      } catch {
        // Title update failure is non-critical
      }
    },

    generateImage: async (sid: string) => {
      const { slug, isGenerating } = get();
      if (!slug || isGenerating) return;
      set((s) => {
        s.isGenerating = true;
      });
      try {
        const resp = await imagesApi.generateImage(slug, sid);
        set((s) => {
          s.isGenerating = false;
          s.cost += resp.generation_cost;
          const idx = s.slides.findIndex((sl) => sl.sid === sid);
          if (idx !== -1) {
            s.slides[idx]!.has_matching_image = true;
            s.slides[idx]!.image_count += 1;
          }
        });
        if (get().selectedSlideId === sid) {
          await get().loadSlideImages(sid);
        }
      } catch (err) {
        set((s) => {
          s.isGenerating = false;
        });
        throw err;
      }
    },

    loadSlideImages: async (sid: string) => {
      const { slug } = get();
      if (!slug) return;
      try {
        const resp = await imagesApi.getSlideImages(slug, sid);
        set((s) => {
          s.currentImages = resp.images;
          s.selectedImageFilename = resp.images.find((i) => i.is_current)?.filename ?? null;
        });
      } catch {
        set((s) => {
          s.currentImages = [];
          s.selectedImageFilename = null;
        });
      }
    },

    selectImage: (filename: string) => {
      set((s) => {
        s.selectedImageFilename = filename;
      });
    },

    setStyle: (style: Style) => {
      set((s) => {
        s.style = style;
      });
    },

    openStyleModal: () => {
      set((s) => {
        s.isStyleModalOpen = true;
      });
    },

    closeStyleModal: () => {
      set((s) => {
        s.isStyleModalOpen = false;
      });
    },

    openEditModal: (sid: string) => {
      set((s) => {
        s.editingSlideId = sid;
      });
    },

    closeEditModal: () => {
      set((s) => {
        s.editingSlideId = null;
      });
    },
  })),
);
