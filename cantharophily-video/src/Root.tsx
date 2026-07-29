import { Composition } from "remotion";
import { Cantharophily } from "./Composition";
import { timeline } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Cantharophily"
      component={Cantharophily}
      durationInFrames={timeline.totalFrames}
      fps={timeline.fps}
      width={timeline.width}
      height={timeline.height}
    />
  );
};
