<script>
  import { fonts, colors, backgrounds } from './tokens.js';
  import CircuitVine from './CircuitVine.svelte';
  import ProjectCard from './ProjectCard.svelte';
  import PageNumber from './PageNumber.svelte';
</script>

<div class="page" style:background={backgrounds.paper}>
  <CircuitVine page="left"/>
  <div class="header" style:font-family={fonts.mono} style:color={colors.termDim}>&gt; ls ~/core</div>
  <div class="cards">
    <ProjectCard name="Ur" description="A recursive specification framework. The ontological kernel."/>
    <ProjectCard name="Faewyld" description="Agent orchestration. Self-optimizing autonomous loops."/>
    <ProjectCard name="Ludex" description="The knowledge and crossing layer. Navigation through meaning."/>
  </div>
  <PageNumber number="iv"/>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    padding: 40px 32px 32px; position: relative;
  }
  .header {
    font-size: 0.6rem;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
    opacity: 0.5;
  }
  .cards { display: flex; flex-direction: column; gap: 14px; }
</style>
