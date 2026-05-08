import { useEffect, useState, useCallback } from "react";
import { useSlideStore } from "@/stores/slideStore";
import type { ProjectSummary } from "@/types";

export default function ProjectList() {
  const projects = useSlideStore((s) => s.projects);
  const isLoading = useSlideStore((s) => s.isLoadingProjects);
  const loadProjects = useSlideStore((s) => s.loadProjects);
  const loadProject = useSlideStore((s) => s.loadProject);

  const [showCreate, setShowCreate] = useState(false);
  const [newSlug, setNewSlug] = useState("");

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOpen = useCallback(
    (slug: string) => {
      loadProject(slug);
    },
    [loadProject],
  );

  const handleCreate = useCallback(() => {
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug) return;
    setShowCreate(false);
    setNewSlug("");
    loadProject(slug);
  }, [newSlug, loadProject]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center h-14 px-6 bg-white border-b border-gray-200 shadow-sm">
        <span className="text-xl font-bold text-blue-600">Prism</span>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          Your Projects
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Select a project to continue, or create a new one.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Existing projects */}
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} onOpen={handleOpen} />
            ))}

            {/* Create new project */}
            {showCreate ? (
              <div className="rounded-xl border-2 border-dashed border-blue-300 bg-white p-5 flex flex-col justify-center">
                <input
                  autoFocus
                  type="text"
                  placeholder="project-slug"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") {
                      setShowCreate(false);
                      setNewSlug("");
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    className="flex-1 btn-primary text-sm py-1.5"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreate(false);
                      setNewSlug("");
                    }}
                    className="flex-1 btn-secondary text-sm py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-xl border-2 border-dashed border-gray-300 bg-white
                  hover:border-blue-400 hover:bg-blue-50 transition-colors
                  flex flex-col items-center justify-center py-12 cursor-pointer"
              >
                <svg
                  className="w-10 h-10 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-500">
                  New Project
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: ProjectSummary;
  onOpen: (slug: string) => void;
}) {
  return (
    <button
      onClick={() => onOpen(project.slug)}
      className="rounded-xl border border-gray-200 bg-white p-5 text-left
        hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
    >
      <h3 className="text-base font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
        {project.title}
      </h3>
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span>
          {project.slide_count} slide{project.slide_count !== 1 ? "s" : ""}
        </span>
        <span className="text-gray-300">|</span>
        <span>${project.total_cost.toFixed(2)}</span>
      </div>
      <p className="text-[11px] text-gray-400 mt-2 truncate">{project.slug}</p>
    </button>
  );
}
