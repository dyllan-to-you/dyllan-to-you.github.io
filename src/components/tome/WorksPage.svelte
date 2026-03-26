<script>
  import { fonts, colors, backgrounds } from './tokens.js';
  import CircuitVine from './CircuitVine.svelte';
  import ChapterHeader from './ChapterHeader.svelte';
  import ProjectCard from './ProjectCard.svelte';
  import PageNumber from './PageNumber.svelte';
</script>

<div class="page" style:background={backgrounds.paper}>
  <CircuitVine page="right"/>
  <ChapterHeader number="II" title="The Works" subtitle="Projects and pursuits"/>
  <div class="cards">
    <ProjectCard name="Locus" description="Coaching tools. Detecting phase transitions and applying pressure at the edge of becoming."/>
    <ProjectCard name="Verve" description="Personal productivity. Time and rhythm as first-class primitives."/>
    <ProjectCard name="Toast" description="Cryptographic proof-of-presence. The clink of glasses, verified."/>
  </div>
  <PageNumber number="v"/>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    padding: 40px 32px 32px; position: relative;
  }
  .cards { display: flex; flex-direction: column; gap: 14px; }
</style>
