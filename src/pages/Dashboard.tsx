import React, { useState } from 'react';
import { PlusIcon, SearchIcon, FolderIcon, AlertCircleIcon, TrashIcon } from '../components/Icons';
import { useProjectStore } from '../stores/projectStore';
import { useBuildStore } from '../stores/buildStore';
import { ProjectCard } from '../components/ProjectCard';
import { AddProjectModal } from '../components/AddProjectModal';
import { Project } from '../types/project';
import { useBuild } from '../hooks/useBuild';

export const Dashboard: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject, error, clearError } =
    useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [deletingProject, setDeletingProject] = useState<Project | undefined>(undefined);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deletingProject) {
        setDeletingProject(undefined);
      }
    };

    if (deletingProject) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deletingProject]);

  const { startBuild } = useBuild();

  const activeBuilds = useBuildStore((state) => state.activeBuilds);
  const buildHistory = useBuildStore((state) => state.buildHistory);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ios.bundleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.android.bundleId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSaveProject = (projectData: Omit<Project, 'id'>) => {
    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      const newProject: Project = {
        ...projectData,
        id: Math.random().toString(36).substr(2, 9),
      };
      addProject(newProject);
    }
    setEditingProject(undefined);
    setIsModalOpen(false);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleAddProject = () => {
    setEditingProject(undefined);
    setIsModalOpen(true);
  };

  const handleBuild = async (
    projectId: string,
    platform: 'ios' | 'android',
    options?: { uploadToAppStore?: boolean },
  ) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      await startBuild(project, platform, options);
    }
  };

  const handleDeleteProject = (project: Project) => {
    setDeletingProject(project);
  };

  const handleConfirmDelete = async () => {
    if (deletingProject) {
      await deleteProject(deletingProject.id);
      setDeletingProject(undefined);
    }
  };

  const getProjectWithStatus = (project: Project): Project => {
    const active = activeBuilds[project.id];
    const lastHistory = buildHistory.find((h) => h.projectId === project.id);
    return {
      ...project,
      lastBuild: active || lastHistory,
    };
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '4px',
              color: 'var(--color-primary)',
            }}
          >
            Projects
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Manage and release your mobile applications
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleAddProject}>
          <PlusIcon size={18} />
          <span>Add Project</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="card"
          style={{
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)',
            background:
              'linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(255, 59, 48, 0.05) 100%)',
            border: '1px solid rgba(255, 59, 48, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <div className="icon-container icon-container-error">
              <AlertCircleIcon size={16} />
            </div>
            <span style={{ color: 'var(--color-error)', fontWeight: 500 }}>Error: {error}</span>
          </div>
          <button
            onClick={clearError}
            className="btn btn-ghost"
            style={{
              color: 'var(--color-error)',
              fontWeight: 600,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="search-input-wrapper" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <SearchIcon size={18} className="search-icon" />
        <input
          type="text"
          className="input"
          placeholder="Search projects by name or bundle ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            paddingLeft: '48px',
            height: '48px',
            fontSize: '15px',
          }}
        />
      </div>

      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FolderIcon size={32} />
          </div>
          <h3 className="empty-state-title">No projects found</h3>
          <p className="empty-state-description">
            {searchTerm
              ? "Try adjusting your search term to find what you're looking for."
              : 'Add your first project to start building amazing mobile apps!'}
          </p>
          {!searchTerm && (
            <button
              className="btn btn-primary"
              onClick={handleAddProject}
              style={{ marginTop: 'var(--spacing-lg)' }}
            >
              <PlusIcon size={18} />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-auto-fill">
          {filteredProjects.map((project, index) => {
            const projectWithStatus = getProjectWithStatus(project);
            return (
              <div
                key={project.id}
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`,
                }}
              >
                <ProjectCard
                  project={projectWithStatus}
                  onBuild={(platform, options) => handleBuild(project.id, platform, options)}
                  onSelect={() => console.log('Selected', project.id)}
                  onEdit={() => handleEditProject(project)}
                  onDelete={() => handleDeleteProject(project)}
                />
              </div>
            );
          })}
        </div>
      )}

      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(undefined);
        }}
        onSave={handleSaveProject}
        initialData={editingProject}
      />

      {/* Delete Confirmation Dialog */}
      {deletingProject && (
        <div className="modal-overlay" onClick={() => setDeletingProject(undefined)}>
          <div
            className="card modal-content"
            style={{
              maxWidth: '420px',
              padding: 'var(--spacing-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 59, 48, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--spacing-lg)',
              }}
            >
              <TrashIcon size={28} style={{ color: 'var(--color-error)' }} />
            </div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: 'var(--spacing-sm)',
                textAlign: 'center',
              }}
            >
              Delete Project
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--spacing-xl)',
                textAlign: 'center',
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to delete "<strong>{deletingProject.name}</strong>"? This action
              cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingProject(undefined)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete} style={{ flex: 1 }}>
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
