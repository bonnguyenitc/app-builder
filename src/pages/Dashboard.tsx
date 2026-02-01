import React, { useState } from 'react';
import {
  PlusIcon,
  SearchIcon,
  FolderIcon,
  AlertCircleIcon,
  TrashIcon,
  EraserIcon,
} from '../components/Icons';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useBuildStore } from '../stores/buildStore';
import { ProjectCard } from '../components/ProjectCard';
import { AddProjectModal } from '../components/AddProjectModal';
import { DeepCleanModal } from '../components/DeepCleanModal';
import { Project } from '../types/project';
import { useBuild } from '../hooks/useBuild';
import { invoke } from '@tauri-apps/api/core';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects, addProject, updateProject, deleteProject, error, clearError } =
    useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [deletingProject, setDeletingProject] = useState<Project | undefined>(undefined);
  const [cleaningProject, setCleaningProject] = useState<Project | undefined>(undefined);
  const [confirmingCleanProject, setConfirmingCleanProject] = useState<Project | undefined>(
    undefined,
  );

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

  const handleDeepClean = (project: Project) => {
    setConfirmingCleanProject(project);
  };

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

  const handleConfirmDelete = () => {
    if (deletingProject) {
      deleteProject(deletingProject.id);
      setDeletingProject(undefined);
    }
  };

  const handleStartMetro = async (project: Project) => {
    try {
      await invoke('start_metro', { projectPath: project.path });
    } catch (err) {
      console.error('Failed to start metro:', err);
    }
  };

  const handleOpenVSCode = async (project: Project) => {
    try {
      await invoke('open_in_vscode', { projectPath: project.path });
    } catch (err) {
      console.error('Failed to open VS Code:', err);
    }
  };

  const handleOpenXcode = async (project: Project) => {
    try {
      await invoke('open_xcode', { projectPath: project.path });
    } catch (err) {
      console.error('Failed to open Xcode:', err);
    }
  };

  const handleOpenAndroidStudio = async (project: Project) => {
    try {
      await invoke('open_android_studio', { projectPath: project.path });
    } catch (err) {
      console.error('Failed to open Android Studio:', err);
    }
  };

  const handleOpenTerminal = async (project: Project) => {
    try {
      await invoke('open_terminal', { projectPath: project.path });
    } catch (err) {
      console.error('Failed to open terminal:', err);
    }
  };

  const handleRunApp = async (project: Project, platform: 'ios' | 'android') => {
    try {
      await invoke('run_app_on_booted_device', { projectPath: project.path, platform });
    } catch (err) {
      console.error('Failed to run app:', err);
      // Maybe set some global error state to show a toast
    }
  };

  const getProjectWithStatus = (project: Project): Project => {
    const active = activeBuilds[project.id];
    const lastHistory = buildHistory.find((h) => h.projectId === project.id);

    // Create a merged project object that prioritizes active build info
    return {
      ...project,
      lastBuild: active || lastHistory || undefined,
    };
  };

  return (
    <div
      className="page-container"
      style={{
        padding: 'var(--spacing-2xl)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: '1600px',
        margin: '0 auto',
      }}
    >
      {/* Premium Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexShrink: 0,
          animation: 'fadeInDown 0.5s ease-out',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                color: 'var(--color-primary)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Workspace
            </span>
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--color-text)',
              letterSpacing: '-0.02em',
            }}
          >
            Projects
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginTop: '4px' }}>
            Manage and develop your mobile applications in one place.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleAddProject}
          style={{
            height: '46px',
            borderRadius: '14px',
            padding: '0 24px',
            boxShadow: '0 8px 16px rgba(0, 122, 255, 0.15)',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          <PlusIcon size={20} />
          <span>New Project</span>
        </button>
      </header>

      {/* Search & Actions Bar */}
      <div
        style={{
          marginBottom: '32px',
          display: 'flex',
          gap: 'var(--spacing-md)',
          flexShrink: 0,
        }}
      >
        <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
          <SearchIcon
            size={20}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-secondary)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search by name, bundle id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            style={{
              paddingLeft: '48px',
              height: '52px',
              fontSize: '16px',
              borderRadius: '16px',
              background: 'var(--color-sidebar)',
              border: '1px solid var(--color-border)',
              transition: 'all 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            background: 'rgba(255, 59, 48, 0.08)',
            border: '1px solid rgba(255, 59, 48, 0.2)',
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircleIcon size={20} style={{ color: 'var(--color-error)' }} />
            <span style={{ color: 'var(--color-error)', fontWeight: 500 }}>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="btn btn-ghost"
            style={{ color: 'var(--color-error)', fontWeight: 600 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Scrollable Project Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: '40px',
          minHeight: 0,
          margin: '0 -8px', // offset card shadows
          padding: '8px',
        }}
      >
        {filteredProjects.length === 0 ? (
          <div
            className="empty-state"
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'var(--color-sidebar)',
              borderRadius: '32px',
              border: '2px dashed var(--color-border)',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <FolderIcon size={40} style={{ opacity: 0.3 }} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              {searchTerm ? 'No projects matches' : 'Start your journey'}
            </h3>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                maxWidth: '300px',
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              {searchTerm
                ? 'Try a different search term or clear the search to see all projects.'
                : 'Connect your first React Native project to get started with building and releasing.'}
            </p>
            {!searchTerm && (
              <button
                className="btn btn-primary"
                onClick={handleAddProject}
                style={{ height: '42px', borderRadius: '12px', padding: '0 20px' }}
              >
                <PlusIcon size={18} />
                <span>Add Project</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-auto-fill" style={{ gap: '24px' }}>
            {filteredProjects.map((project, index) => {
              const projectWithStatus = getProjectWithStatus(project);
              return (
                <div
                  key={project.id}
                  style={{
                    animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both`,
                  }}
                >
                  <ProjectCard
                    project={projectWithStatus}
                    onBuild={(platform, options) => handleBuild(project.id, platform, options)}
                    onSelect={() => handleStartMetro(project)}
                    onEdit={() => handleEditProject(project)}
                    onDelete={() => handleDeleteProject(project)}
                    onPermissions={() => navigate(`/permissions/${project.id}`)}
                    onDeepClean={() => handleDeepClean(project)}
                    onOpenXcode={() => handleOpenXcode(project)}
                    onOpenAndroidStudio={() => handleOpenAndroidStudio(project)}
                    onStartMetro={() => handleStartMetro(project)}
                    onOpenVSCode={() => handleOpenVSCode(project)}
                    onOpenTerminal={() => handleOpenTerminal(project)}
                    onRunApp={(platform) => handleRunApp(project, platform)}
                    onDependencies={() => navigate(`/dependencies/${project.id}`)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(undefined);
        }}
        onSave={handleSaveProject}
        initialData={editingProject}
      />

      <DeepCleanModal
        isOpen={!!cleaningProject}
        project={cleaningProject || null}
        onClose={() => setCleaningProject(undefined)}
      />

      {/* Delete Confirmation Dialog */}
      {deletingProject && (
        <div
          className="modal-overlay"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setDeletingProject(undefined)}
        >
          <div
            className="card modal-content"
            style={{
              maxWidth: '440px',
              padding: '32px',
              borderRadius: '28px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(255, 59, 48, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <TrashIcon size={32} style={{ color: 'var(--color-error)' }} />
            </div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 800,
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              Delete Project?
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                marginBottom: '32px',
                textAlign: 'center',
                lineHeight: 1.6,
                fontSize: '16px',
              }}
            >
              Are you sure you want to delete{' '}
              <strong style={{ color: 'var(--color-text)' }}>{deletingProject.name}</strong>? This
              action cannot be undone and will remove all local history.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingProject(undefined)}
                style={{ flex: 1, height: '48px', borderRadius: '14px' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  height: '48px',
                  borderRadius: '14px',
                  background: 'var(--color-error)',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deep Clean Confirmation Dialog */}
      {confirmingCleanProject && (
        <div
          className="modal-overlay"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setConfirmingCleanProject(undefined)}
        >
          <div
            className="card modal-content"
            style={{
              maxWidth: '460px',
              padding: '32px',
              borderRadius: '28px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(255, 159, 10, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <EraserIcon size={32} style={{ color: '#FF9F0A' }} />
            </div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 800,
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              Deep Clean?
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                marginBottom: '24px',
                textAlign: 'center',
                lineHeight: 1.6,
                fontSize: '15px',
              }}
            >
              This will perform a heavy maintenance on{' '}
              <strong style={{ color: 'var(--color-text)' }}>{confirmingCleanProject.name}</strong>.
            </p>
            <div
              style={{
                background: 'rgba(0,0,0,0.2)',
                padding: '16px',
                borderRadius: '16px',
                marginBottom: '32px',
              }}
            >
              <ul
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '13px',
                  margin: 0,
                  paddingLeft: '20px',
                }}
              >
                <li>Delete node_modules and reinstall</li>
                <li>Clear iOS build artifacts and Pods</li>
                <li>Clear Android build artifacts</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmingCleanProject(undefined)}
                style={{ flex: 1, height: '48px', borderRadius: '14px' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setCleaningProject(confirmingCleanProject);
                  setConfirmingCleanProject(undefined);
                }}
                style={{
                  flex: 1,
                  height: '48px',
                  borderRadius: '14px',
                  backgroundColor: '#FF9F0A',
                  borderColor: '#FF9F0A',
                }}
              >
                Start Cleaning
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
