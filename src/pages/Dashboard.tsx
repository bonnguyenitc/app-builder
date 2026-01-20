import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useBuildStore } from '../stores/buildStore';
import { ProjectCard } from '../components/ProjectCard';
import { AddProjectModal } from '../components/AddProjectModal';
import { Project } from '../types/project';
import { useBuild } from '../hooks/useBuild';

export const Dashboard: React.FC = () => {
  const { projects, addProject, updateProject } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const { startBuild } = useBuild();

  const activeBuilds = useBuildStore((state) => state.activeBuilds);
  const buildHistory = useBuildStore((state) => state.buildHistory);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bundleId.ios.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bundleId.android.toLowerCase().includes(searchTerm.toLowerCase()),
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Projects</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Manage and release your projects
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleAddProject}>
          <Plus size={18} />
          <span>Add Project</span>
        </button>
      </div>

      <div
        style={{
          marginBottom: 'var(--spacing-xl)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 'var(--spacing-md)',
            color: 'var(--color-text-secondary)',
          }}
        />
        <input
          type="text"
          placeholder="Search projects by name or bundle ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: 'var(--spacing-sm) var(--spacing-md) var(--spacing-sm) 40px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            marginTop: 'var(--spacing-xl)',
          }}
        >
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No projects found. Add your first project to get started!
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}
        >
          {filteredProjects.map((project) => {
            const projectWithStatus = getProjectWithStatus(project);
            return (
              <ProjectCard
                key={project.id}
                project={projectWithStatus}
                onBuild={(platform, options) => handleBuild(project.id, platform, options)}
                onSelect={() => console.log('Selected', project.id)}
                onEdit={() => handleEditProject(project)}
              />
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
    </div>
  );
};
