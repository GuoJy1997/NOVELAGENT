import './styles/cockpit.css';
import { AppShell } from './features/novelora-cockpit/components/AppShell';
import { ProjectSidebar } from './features/novelora-cockpit/components/ProjectSidebar';
import { WorkspaceTopbar } from './features/novelora-cockpit/components/WorkspaceTopbar';
import { noveloraMockProject } from './features/novelora-cockpit/data/noveloraMockProject';

export default function App() {
  return (
    <AppShell
      sidebar={<ProjectSidebar project={noveloraMockProject} />}
      topbar={<WorkspaceTopbar project={noveloraMockProject} />}
      rightPanel={
        <div className="coming-soon-panel">
          <p className="workspace-eyebrow">Workspace assistant</p>
          <h2>Coming soon</h2>
          <p>Guided story support will appear here.</p>
        </div>
      }
    >
      <div className="workspace-loading-state">
        <p className="workspace-eyebrow">Story Map</p>
        <h2>Story workspace is loading</h2>
        <p>Your chapter map and narrative connections will appear here.</p>
      </div>
    </AppShell>
  );
}
