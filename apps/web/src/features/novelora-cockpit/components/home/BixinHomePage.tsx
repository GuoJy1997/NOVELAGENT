import type { ReactNode } from 'react';
import type { NavId } from '../../nav';
import { HeroSection } from './HeroSection';
import { HomeDashboard } from './HomeDashboard';
import { HomeTopbar } from './HomeTopbar';
import { NavigationRail } from './NavigationRail';
import { SceneLayer } from './SceneLayer';
import { useFitScale } from './useFitScale';

export interface BixinHomePageProps {
  activeNavigation: NavId;
  onSelectNavigation: (item: NavId) => void;
  onContinueWriting: () => void;
  onNewProject: () => void;
  onOpenProject: () => void;
  onShowMessage: (message: string) => void;
  coverSrc?: string;
  projectId?: string;
  children?: ReactNode;
}

export function BixinHomePage(props: BixinHomePageProps) {
  const isHome = props.activeNavigation === 'home';
  const isWriting = props.activeNavigation === 'writing';
  const frameRef = useFitScale(isWriting ? { designWidth: 1536, designHeight: 1024 } : undefined);

  return (
    <div className={`bixin-home${isWriting ? ' bixin-home--writing' : ''}`} data-page={isHome ? 'home' : 'workbench'}>
      <div className="bixin-home__frame" data-bixin-profile={isWriting ? 'writing' : 'canonical'} ref={frameRef}>
        <SceneLayer variant={isHome ? 'home' : 'workbench'} />
        <div className="bixin-home__interface">
          <NavigationRail
            activeItem={props.activeNavigation}
            onSelectItem={props.onSelectNavigation}
            onNewProject={props.onNewProject}
            onShowMessage={props.onShowMessage}
          />
          <div className={`bixin-home__stage${isHome ? '' : ' bixin-home__stage--workbench'}`}>
            <HomeTopbar onShowMessage={props.onShowMessage} onOpenProject={props.onOpenProject} />
            {isHome ? (
              <HeroSection
                onContinueWriting={props.onContinueWriting}
                onNewProject={props.onNewProject}
              />
            ) : null}
            <main
              className={isHome ? 'bixin-home__dashboard' : 'bixin-home__workbench'}
              aria-label={isHome ? '创作首页' : '工作台'}
            >
              {isHome ? (
                <HomeDashboard
                  onNewProject={props.onNewProject}
                  onOpenProject={props.onOpenProject}
                  coverSrc={props.coverSrc}
                  projectId={props.projectId}
                  onNavigate={props.onSelectNavigation}
                  onStartWriting={props.onContinueWriting}
                  onShowMessage={props.onShowMessage}
                />
              ) : (
                props.children
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
