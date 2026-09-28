MASTER ORCHESTRATION PROMPT
PREMIUM 3D MECHANICAL PENCIL PRODUCT EXPERIENCE
You are the lead creative, technical, and orchestration director responsible for turning the current active repository into an exceptional, production-quality interactive mechanical pencil product experience.
Your job is not to produce a competent website.
Your job is to create something that feels like a world-class digital product film: deeply art-directed, physically convincing, obsessively polished, technically sophisticated, and heavily centered around real-time 3D.
The target is:
Apple product storytelling × elite industrial design portfolio × cinematic WebGL experience × premium editorial design.
The final website should feel as though it was created by a coordinated team of:
	•	creative director
	•	industrial designer
	•	3D artist
	•	WebGL engineer
	•	motion designer
	•	interaction designer
	•	typography designer
	•	frontend engineer
	•	performance engineer
	•	responsive specialist
	•	QA engineer
Do not imitate a generic "premium landing page."
Do not produce a template.
Do not produce AI-slop.
Build the actual experience.

0. ABSOLUTE EXECUTION RULES
START FROM THE CURRENT ACTIVE REPOSITORY
The repository/worktree you have been given is the only source of truth and the place where all work must happen.
Begin by inspecting the active repository, its files, package configuration, assets, constraints, and runtime.
Do not create a separate project somewhere else.
Do not initialize a parallel demo repository.
Do not build a throwaway prototype and leave the real repository untouched.
Do not assume the existing implementation is worth preserving.
Treat the active repository as the starting canvas.
If substantial existing implementation exists, determine what should be retained, replaced, refactored, or completely rebuilt.
The objective is to arrive at the final product inside this active repository.
Preserve useful user-provided assets and factual product information, but do not allow weak existing architecture or styling to constrain the final result.

1. DO NOT START CODING IMMEDIATELY
Before writing meaningful implementation code, perform a structured reconnaissance phase.
You have access to multiple agents.
Use them aggressively.
Do not force the entire project through one agent.
Do not serialize work unnecessarily.
When the harness supports parallel subagents, launch a large parallel research/review group.
Target approximately 12–20 specialist agents across the reconnaissance and review cycles when practical.
Specialist agents should use Sonnet 5 rather than Opus when available.
Use the strongest appropriate model available for the primary orchestrator itself.

2. DISCOVER AVAILABLE SKILLS BEFORE IMPLEMENTATION
Do not assume that the known skill list is complete.
First inspect the harness/environment for all available skills.
Search for skills relevant to:
	•	Three.js
	•	React Three Fiber
	•	3D scene construction
	•	WebGL
	•	shaders
	•	materials
	•	lighting
	•	product visualization
	•	industrial/product design
	•	motion design
	•	scroll animation
	•	smooth scrolling
	•	Lenis
	•	GSAP
	•	interaction design
	•	frontend design
	•	visual design
	•	typography
	•	responsive design
	•	performance
	•	WebGL optimization
	•	accessibility
	•	browser testing
	•	Playwright
	•	visual regression
	•	image optimization
	•	3D asset optimization
Explicitly load the relevant skills before implementing the associated parts of the system.
Known relevant skills include:
	•	design-motion-principles
	•	web-design-guidelines
	•	threejs-scenes
	•	design-taste-frontend
But do not stop there.
Discover additional relevant skills dynamically and use them.
If the harness exposes a skill registry, search it.
If the harness provides skill files or documentation, read the relevant ones.
If a skill is applicable to a specific phase, load it before that phase rather than merely mentioning it.

3. RESEARCH THE RIGHT TECHNICAL BUILDING BLOCKS
Do not blindly install libraries.
Research the current official documentation/repositories for candidate technologies and determine which are actually appropriate.
At minimum investigate:
Core 3D
	•	Three.js
	•	React Three Fiber
	•	@react-three/drei
	•	relevant Three.js examples and techniques
React Three Fiber is the official React renderer for Three.js and should be strongly considered as the foundation if the application architecture is React-based.
Scroll
	•	Lenis
	•	native scroll APIs
	•	GSAP ScrollTrigger if appropriate
	•	alternatives if the existing stack makes another approach better
Lenis is specifically designed for smooth scrolling and is intended for experiences such as WebGL scroll synchronization and parallax.
Background / Ambient Motion
Investigate Vanta.js and similar approaches.
Vanta provides animated Three.js/WebGL or p5.js backgrounds and can be used with React, but it should not automatically replace the dedicated product scene.
Use it only if its effect materially improves the art direction.
Additional 3D / animation ecosystem
Investigate as appropriate:
	•	Drei
	•	Theatre.js
	•	GSAP
	•	@react-three/postprocessing
	•	shader-based effects
	•	environment-map techniques
	•	asset compression
	•	GLTF/GLB tooling
	•	relevant R3F ecosystem packages
Do not add a dependency because it is fashionable.
Add it because it materially improves the result.

4. AGENT FAN-OUT
During reconnaissance, launch independent specialists in parallel.
At minimum create specialist investigations for:
01 — Creative Director
Determine:
	•	visual language
	•	art direction
	•	color system
	•	composition
	•	typography
	•	visual hierarchy
	•	whitespace
	•	product-to-copy relationship
	•	section rhythm
	•	transitions
	•	overall emotional progression
Deliver a concise creative direction document.

02 — Industrial Design Specialist
Study the mechanical pencil as an engineered object.
Define:
	•	proportions
	•	silhouette
	•	component relationships
	•	believable tolerances
	•	seams
	•	machining language
	•	grip geometry
	•	nose construction
	•	internal mechanism
	•	materials
	•	exploded relationships
Identify where visual accuracy matters most.

03 — 3D Architecture Specialist
Design the WebGL architecture.
Investigate:
	•	R3F scene architecture
	•	scene graph
	•	component boundaries
	•	model hierarchy
	•	animation architecture
	•	camera architecture
	•	environment lighting
	•	materials
	•	reflections
	•	shadows
	•	post-processing
	•	asset loading
	•	quality scaling
Ensure the architecture can support the entire product story without creating disconnected scenes.

04 — Three.js / Rendering Specialist
Focus deeply on:
	•	physically convincing materials
	•	lighting
	•	reflection quality
	•	studio environments
	•	environment maps
	•	contact shadows
	•	tone mapping
	•	anti-aliasing
	•	post-processing
	•	shader opportunities
	•	camera optics
	•	render quality
The goal is product photography quality in real time.

05 — Product Modeling Specialist
Focus on the actual mechanical pencil geometry.
Potential components:
	•	barrel
	•	grip
	•	nose cone
	•	lead sleeve
	•	clutch
	•	internal shaft
	•	lead guide
	•	spring
	•	eraser
	•	eraser housing
	•	clicker
	•	top cap
	•	clips
	•	structural elements
	•	seams
	•	machining details
Do not blindly maximize polygon count.
Prioritize geometry that affects:
	•	silhouette
	•	shadows
	•	highlights
	•	reflections
	•	close-ups
	•	exploded views
	•	internal views

06 — Material Specialist
Develop physically believable materials for:
	•	anodized aluminum
	•	stainless steel
	•	plastic
	•	rubber
	•	frosted metallic surfaces
	•	polished edges
	•	textured/knurled surfaces
	•	transparent shells where needed
Pay particular attention to the user's expectation that surfaces should visibly catch and reflect light.
The model must not look flat, matte, or like generic primitives.

07 — Lighting / Product Photography Specialist
Design a professional virtual studio.
Study:
	•	key light
	•	fill
	•	rim lighting
	•	reflection cards
	•	softboxes
	•	environment lighting
	•	contact shadows
	•	highlight placement
	•	gradient reflections
	•	controlled specular response
Materials must communicate form through light.
Do not rely on color alone.

08 — Motion Director
Define the entire motion language.
Investigate:
	•	scroll timing
	•	inertia
	•	damping
	•	camera movement
	•	object rotation
	•	scale
	•	depth
	•	transitions
	•	exploded-view choreography
	•	x-ray transition
	•	reassembly
	•	microinteractions
	•	variant transitions
	•	touch behavior
	•	reduced-motion behavior
Every animation needs a purpose.

09 — Scroll Systems Specialist
Evaluate:
	•	Lenis
	•	native scroll
	•	GSAP
	•	normalized progress
	•	scroll velocity
	•	interpolation
	•	sticky scenes
	•	horizontal-scroll sections
	•	viewport synchronization
Design a robust system where scroll feels physical and continuous rather than a sequence of arbitrary CSS animations.

10 — Frontend Architect
Determine:
	•	framework structure
	•	components
	•	state management
	•	asset pipeline
	•	scene lifecycle
	•	responsive architecture
	•	loading
	•	accessibility
	•	performance boundaries
	•	maintainability
Avoid giant monolithic components.
Avoid unnecessary abstraction.

11 — Interaction / UX Specialist
Analyze:
	•	navigation
	•	scroll discoverability
	•	interaction feedback
	•	product controls
	•	variant switching
	•	CTA behavior
	•	purchase flow
	•	touch interactions
	•	keyboard navigation
	•	accessibility
The interface must remain understandable even while the visuals are extremely sophisticated.

12 — Typography / Editorial Specialist
Determine:
	•	font pairing
	•	weight hierarchy
	•	scale
	•	tracking
	•	line length
	•	captions
	•	technical labels
	•	product statements
	•	alignment
	•	responsive typography
The typography should feel editorial and intentional rather than like a design-system default.

13 — Responsive Specialist
Design separately for:
	•	1920×1080
	•	1440×900
	•	1280×800
	•	tablet
	•	430×932
	•	390×844
Do not merely shrink desktop.
Determine where camera positions, section heights, typography, object scale, and timing must change.

14 — Performance Specialist
Investigate:
	•	GPU cost
	•	draw calls
	•	geometry
	•	textures
	•	DPR
	•	shaders
	•	post-processing
	•	frame pacing
	•	React rerenders
	•	animation loops
	•	scroll calculations
	•	asset loading
	•	memory
	•	mobile thermals
Design adaptive quality rather than simply removing the interesting parts.

15 — Browser / Playwright Specialist
Determine an actual browser validation strategy.
Test:
	•	rendering
	•	scrolling
	•	sticky behavior
	•	horizontal scrolling
	•	layout
	•	overflow
	•	3D scene state
	•	console errors
	•	broken assets
	•	mobile viewports
	•	interaction behavior
	•	screenshots

16 — Visual Critic
Act as a hostile design reviewer.
Look specifically for:
	•	AI-slop patterns
	•	generic layouts
	•	repetitive sections
	•	weak hierarchy
	•	bad spacing
	•	fake materials
	•	flat lighting
	•	excessive gradients
	•	unnecessary cards
	•	weak transitions
	•	meaningless motion
	•	poor typography
	•	product being visually subordinate to UI
Do not be polite.

17 — Competitive / Reference Research Specialist
Research excellent interactive product experiences, digital product films, award-winning WebGL sites, industrial-design portfolios, and relevant contemporary interaction patterns.
Extract techniques and principles.
Do not copy another website.
Use references to raise the quality bar.

18 — Asset / Implementation Specialist
Inspect all existing assets in the repository.
Determine:
	•	what exists
	•	what can be reused
	•	what must be recreated
	•	which models need refinement
	•	which textures need improvement
	•	what should be procedural
	•	what should be baked
	•	what can be generated at runtime

5. SYNTHESIZE BEFORE BUILDING
After the parallel reconnaissance phase, synthesize the results into one coherent implementation strategy.
Do not simply concatenate every agent's suggestions.
Resolve contradictions.
Choose a single design language.
Choose a coherent rendering strategy.
Choose the minimum dependency set capable of producing the target.
Create:
	1	Creative direction
	2	Technical architecture
	3	Scene architecture
	4	Motion grammar
	5	Page narrative
	6	Responsive strategy
	7	Performance strategy
	8	Testing strategy
Then proceed to implementation.
Do not spend excessive time producing documents once the decisions are sufficiently clear.
Planning exists to accelerate execution, not replace it.

6. EXECUTION PHASES
Work through explicit execution phases.
Do not jump randomly between unrelated pieces.
Each phase has a purpose, implementation target, validation gate, and review.

PHASE 0 — REPOSITORY RECONNAISSANCE
Inspect:
	•	current directory
	•	framework
	•	package manager
	•	package.json
	•	source tree
	•	assets
	•	models
	•	textures
	•	fonts
	•	existing CSS
	•	environment configuration
	•	existing scripts
	•	development server
	•	build system
Determine the cleanest path forward.
Do not inherit bad architecture just because it already exists.
Gate
You must know:
	•	what the current app is
	•	what assets exist
	•	how it runs
	•	how it should be rebuilt
	•	what must remain
	•	what should be replaced

PHASE 1 — FOUNDATION
Build the real production foundation.
Implement:
	•	application shell
	•	typography
	•	global spacing system
	•	responsive primitives
	•	3D canvas architecture
	•	camera system
	•	lighting foundation
	•	loading strategy
	•	scroll architecture
	•	baseline accessibility
Prefer React Three Fiber when the stack supports it.
Use Drei where it provides useful, appropriate abstractions.
Use Lenis or another suitable scroll system when it improves scroll/WebGL synchronization.
Do not overengineer.
Gate
The actual application must run.
The 3D scene must render.
The product must already look convincing.
The scroll system must be stable.

PHASE 2 — PRODUCT MODEL + MATERIALS
Build/refine the mechanical pencil itself.
Priorities:
	1	silhouette
	2	proportions
	3	bevels
	4	normals
	5	seams
	6	material separation
	7	reflections
	8	realistic lighting
	9	meaningful internal geometry
The product must not resemble a collection of cylinders.
Edges must produce believable highlights.
Metal must read as metal.
Frosted metallic surfaces must still react to the studio environment.
Rubber must not look like plastic.
Plastic must not look like metal.

PHASE 3 — HERO
Create the opening experience.
The first screen should immediately communicate:
This is a product.
Not:
This is a website template.
The product should occupy a very large portion of the visual field.
Aim roughly for 60–70% visual dominance where appropriate.
The opening composition should use:
	•	excellent lighting
	•	strong silhouette
	•	sparse typography
	•	large product scale
	•	subtle environment
	•	controlled camera motion
As scrolling begins:
	•	camera moves
	•	pencil rotates
	•	lighting changes
	•	product becomes increasingly dominant
	•	typography yields visual priority to the product
Do not overload the opening scene.

PHASE 4 — CINEMATIC SCROLL NARRATIVE
The scroll story is the heart of the site.
Think of it as a digital product film controlled by the user's scroll.
Use one continuous product where possible.
Do not create a chain of disconnected 3D scenes that happen to share the same model.
Possible progression:
Scene 01 — Hero
Clean, premium, restrained.
Scene 02 — Detail
Camera moves into an important feature.
Potential targets:
	•	grip
	•	clip
	•	machining
	•	nose
	•	button
	•	lead sleeve
The product itself is the feature presentation.
Do not switch to generic feature cards.
Scene 03 — Exploded View
This must be a major visual climax.
The pencil separates along its real mechanical axis.
Components should:
	•	remain correctly oriented
	•	preserve spatial logic
	•	move deliberately
	•	avoid cartoon explosion distances
	•	remain visually legible
The camera should adapt to the exploded geometry.
Scene 04 — X-Ray / Internal Reveal
Transition:
solid → exploded → shell transparency/cutaway → internal mechanism → isolated mechanism → reassembly
Use appropriate techniques:
	•	selective opacity
	•	clipping
	•	alternate materials
	•	hidden-shell states
	•	cutaways
	•	internal lighting
	•	restrained bloom where justified
Do not turn the object into a cheap translucent ghost.
Scene 05 — Mechanism
Show the actual mechanism working.
For example:
Press → compression → clutch release → lead advance → reset.
The 3D object is the infographic.
Scene 06 — Reassembly
Components return precisely to their positions.
The motion should feel engineered.
No cartoon bouncing.
No excessive overshoot.
Scene 07 — Final Product
Return to a clean hero state.
Allow the camera to stabilize.
Give the viewer a satisfying product shot before transitioning onward.

PHASE 5 — INDUSTRIAL DESIGN / PRODUCT PHILOSOPHY
Slow the pacing.
Use sparse editorial composition.
Possible concepts:
	•	balance
	•	tolerance
	•	grip
	•	weight
	•	precision
	•	durability
	•	ergonomics
	•	material choice
One idea at a time.
Do not turn this into a six-card feature grid.

PHASE 6 — PRODUCT FAMILY / VARIANTS
Transition from vertical cinematic storytelling into a horizontal product-family experience.
Vertical scrolling should drive horizontal spatial movement.
This should not look like a generic carousel.
It should feel like walking through a digital product showroom.
Use large product renders with concise information:
	•	name
	•	material
	•	mechanism
	•	meaningful distinction
	•	price if actually known
	•	CTA
Never invent specifications.
Never fabricate product details merely to fill a section.

PHASE 7 — PURCHASE EXPERIENCE
End the presentation with restraint.
Use:
Large product
	•	
name
	•	
price
	•	
variant/finish controls
	•	
purchase CTA
The purchase section should feel like:
the presentation has concluded; now the object is available to own.
Avoid turning it into a giant ecommerce dashboard.

7. 3D QUALITY BAR
The 3D scene is not decorative.
It is the core of the experience.
Prioritize:
	•	accurate proportions
	•	clean silhouette
	•	believable bevels
	•	realistic reflections
	•	physically coherent materials
	•	contact shadows
	•	stable normals
	•	correct component hierarchy
	•	no accidental intersections
	•	no floating geometry
	•	no visually broken topology
	•	convincing thickness
	•	correct axial orientation
During close-ups and exploded states, aggressively inspect for:
	•	inverted components
	•	mirrored pieces
	•	incorrect axes
	•	disconnected geometry
	•	penetration
	•	incorrect pivot points
	•	impossible movement
	•	flat materials
	•	bad reflections
The recently observed tip-axis/orientation class of mistake must be treated as a hard QA target: every mechanical component must preserve its intended physical orientation through all transforms.

8. MATERIAL AND LIGHTING BAR
Do not accept "it technically has a PBR material" as sufficient.
The question is:
Does it look physically convincing in the rendered browser?
Metal should have readable reflection structure.
Frosted metal should have broad controlled highlights rather than becoming lifeless gray.
Edges should catch light.
Different materials should separate visually.
Use the environment as a lighting instrument.
Think like a product photographer.
The studio environment, reflection cards, key light, fill, rim, and shadow system should all work together.

9. CAMERA BAR
Create deliberate camera states:
	•	Hero
	•	Detail
	•	Exploded
	•	X-Ray
	•	Mechanism
	•	Reassembly
	•	Final Product
Interpolate between meaningful states.
Do not randomly rotate the camera.
Use appropriate:
	•	focal length
	•	damping
	•	framing
	•	parallax
	•	depth
	•	perspective
	•	focus
Depth of field should be subtle.
Do not use cinematic blur as a substitute for good composition.

10. MOTION BAR
Motion must feel intentional and physically motivated.
Avoid:
rotation = scrollY
style animation when it creates robotic behavior.
Instead use a normalized scroll-progress architecture with:
	•	interpolation
	•	damping
	•	easing
	•	velocity awareness
	•	carefully chosen spring behavior
	•	scene-state interpolation
	•	stable progress tracking
The experience must feel responsive rather than laggy.
Do not confuse smoothness with delay.

11. TRANSITION BAR
There should be a feeling of spatial continuity.
Prefer transitions such as:
	•	camera pullbacks
	•	camera pushes
	•	continuous rotation
	•	material state transitions
	•	environment changes
	•	spatial repositioning
	•	controlled fades
	•	scene continuity
Avoid:
3D scene → abrupt 2D template section.
The site should feel like one continuous presentation.

12. RESPONSIVE EXPERIENCE
Do not build desktop and then "make it mobile."
Design mobile deliberately.
On mobile, intelligently adapt:
	•	camera distance
	•	object scale
	•	crop
	•	typography
	•	section length
	•	animation distance
	•	DPR
	•	shadow quality
	•	geometry density
	•	post-processing
	•	simultaneous element count
Do not simply delete the interesting experience.
Preserve the core product storytelling.

13. PERFORMANCE
Ambition does not excuse poor engineering.
Optimize:
	•	asset size
	•	GLTF/GLB compression
	•	textures
	•	DPR
	•	draw calls
	•	geometry
	•	shaders
	•	post-processing
	•	React renders
	•	animation loops
	•	scroll calculations
	•	memory
	•	loading
	•	mobile GPU workload
Use adaptive quality.
Desktop may receive:
	•	higher rendering resolution
	•	richer reflections
	•	better shadows
	•	higher detail
	•	more sophisticated effects
Mobile should intelligently reduce expensive rendering while preserving the experience.

14. LOADING
Never show a generic ugly spinner.
Make loading part of the art direction.
Potential approaches:
	•	progress typography
	•	minimal percentage
	•	product silhouette
	•	subtle reveal
	•	staged rendering
Do not hold the user unnecessarily.

15. USE THE BROWSER AS THE SOURCE OF TRUTH
Do not assume the implementation looks good because the source code looks good.
The rendered browser is the truth.
Use Playwright MCP continuously throughout development.
Not just at the end.
Test at minimum:
Desktop
	•	1440×900
	•	1280×800
	•	1920×1080
Mobile
	•	390×844
	•	430×932
Tablet
	•	approximately 768px wide
Inspect screenshots at:
	•	hero
	•	detail
	•	exploded beginning
	•	fully exploded
	•	x-ray
	•	mechanism
	•	reassembly
	•	final hero
	•	horizontal section start
	•	horizontal section middle
	•	purchase section
Also inspect:
	•	browser console
	•	runtime errors
	•	failed assets
	•	layout shifts
	•	clipping
	•	overflow
	•	scroll locking
	•	sticky behavior
	•	WebGL failures
	•	viewport-specific bugs
Fix discovered issues immediately.
Do not merely write them into a report.

16. RENDERED VISUAL REVIEW LOOP
After every major milestone:
	1	Run the application.
	2	Open the real browser version.
	3	Capture screenshots.
	4	Inspect the rendered scene.
	5	Compare it against the art direction.
	6	Identify the three highest-impact problems.
	7	Fix them.
	8	Render again.
	9	Repeat.
Do not stop after the first complete implementation.

17. SECOND AGENT REVIEW WAVE
Once the first complete build exists, fan out again.
Run parallel agents for:
	•	visual critique
	•	industrial-design critique
	•	3D quality
	•	materials
	•	lighting
	•	motion
	•	camera
	•	scroll behavior
	•	responsive behavior
	•	performance
	•	accessibility
	•	UX
	•	Playwright QA
	•	anti-AI-slop review
Then synthesize the findings.
Do not automatically implement every suggestion.
Prioritize improvements that materially raise the experience.

18. THREE LEVELS OF POLISH
Every major feature must pass three levels.
LEVEL 1 — FUNCTION
Does it work?
LEVEL 2 — QUALITY
Does it look correct?
LEVEL 3 — ART DIRECTION
Does it feel exceptional?
Do not stop at Level 1.
Do not mistake technically correct implementation for finished work.

19. ANTI-AI-SLOP GATE
Before declaring completion, inspect the entire page and ask:
	•	Does anything look templated?
	•	Does any section feel like it was generated independently from the others?
	•	Are there unnecessary cards?
	•	Are there generic gradients?
	•	Are there random decorative objects?
	•	Is there excessive glassmorphism?
	•	Is there empty luxury copy?
	•	Is there visual repetition?
	•	Does typography feel generic?
	•	Do transitions feel arbitrary?
	•	Is the 3D object merely decoration?
	•	Is the product ever visually subordinate to interface chrome?
	•	Do materials actually look physical?
	•	Does the site have a point of view?
Anything that feels generic should be redesigned.

20. PRODUCT STORY GATE
The complete site should tell one coherent story:
What is this object?
↓
Why does it look like this?
↓
How is it engineered?
↓
How does the mechanism work?
↓
What differentiates the product variants?
↓
Which one can I own?
The user should understand the product increasingly deeply as they progress.

21. DELETE BEFORE ADDING
During final polish, aggressively remove:
	•	unnecessary copy
	•	unnecessary UI
	•	redundant sections
	•	decorative effects
	•	repetitive animations
	•	visual noise
	•	generic components
	•	unnecessary badges
	•	unnecessary cards
	•	weak content
A premium experience is often improved by subtraction.
Do not keep something merely because an agent already spent time making it.

22. FINAL ART-DIRECTION PASS
Once all major technical work is complete, perform one final review as though this were about to launch publicly.
Evaluate:
	•	first impression
	•	product obsession
	•	pacing
	•	spatial composition
	•	industrial-design credibility
	•	material realism
	•	lighting
	•	camera language
	•	motion quality
	•	typography
	•	transitions
	•	responsive behavior
	•	loading
	•	performance
	•	accessibility
	•	purchase flow
Make broad changes where necessary.
Do not protect the implementation from redesign.
The objective is not to preserve work.
The objective is to maximize the finished experience.

23. DEFINITION OF DONE
Do not declare completion until all of the following are true:
	•	The actual active repository contains the finished implementation.
	•	The application runs from the active repository.
	•	The mechanical pencil is visually convincing.
	•	The pencil dominates the visual storytelling.
	•	The 3D experience is central rather than decorative.
	•	The hero is immediately compelling.
	•	The detail reveal is excellent.
	•	The exploded view is excellent.
	•	Component axes/orientations are correct.
	•	The x-ray/internal view is excellent.
	•	The mechanism animation communicates the engineering.
	•	Reassembly feels precise.
	•	The final product shot feels premium.
	•	The product-family transition feels intentional.
	•	Horizontal scrolling feels natural.
	•	The purchase section is polished.
	•	Materials react convincingly to light.
	•	Reflections and highlights are present where physically appropriate.
	•	Lighting looks like intentional product photography.
	•	Camera movement is deliberate.
	•	Motion is cohesive.
	•	Mobile remains a real experience rather than a degraded desktop.
	•	Performance is responsibly managed.
	•	Accessibility is implemented.
	•	Playwright has been used against the actual rendered site.
	•	Major runtime errors have been fixed.
	•	Major visual issues have been fixed.
	•	There are no obvious AI-slop patterns.
	•	Final visual review has been performed.
	•	Remaining limitations, if any, are explicitly identified.

24. FINAL EXECUTION BEHAVIOR
You are the orchestrator.
Do not merely tell me what should be done.
Coordinate the agents.
Research.
Plan.
Implement.
Render.
Inspect.
Critique.
Fix.
Render again.
Repeat.
Parallelize aggressively whenever tasks can safely be separated.
Use the available skills rather than reinventing their guidance.
Discover additional skills when they could materially improve the result.
Use official documentation and repositories when evaluating technical approaches.
Prefer proven ecosystem tools over homemade equivalents when they materially improve the experience.
Do not add libraries without justification.
Do not stop after the first pass.
Do not optimize away the defining visual moments.
Do not sacrifice the product experience for implementation convenience.
Do not sacrifice mobile quality for desktop spectacle.
Do not sacrifice performance for decorative effects that provide little visual value.
Do not endlessly plan instead of executing.
When a decision can be made from the brief, make it.
When an agent identifies a problem, fix it.
When the rendered result looks weak, redesign it.
When something feels generic, replace it.

CORE CREATIVE TARGET
Keep returning to this:
The website should feel less like a webpage displaying a mechanical pencil and more like a digital product film that happens to be interactive.
The user scrolls.
The camera moves.
The pencil rotates.
The materials catch the light.
The camera approaches.
The object comes apart.
The internal mechanism becomes visible.
The engineering is explained through motion.
The mechanism works.
The parts reassemble.
The camera settles.
The experience expands into the product family.
The user reaches the purchase moment.
Everything feels connected.
Everything feels intentional.
Nothing is filler.
Nothing feels like a template.
Nothing feels like AI-generated decoration.
The result should feel like something a world-class product designer, industrial designer, motion designer, 3D artist, and WebGL engineer would genuinely be proud to put in their portfolio.
Build it from the active repository. Build it from scratch where necessary. Use the agents. Use the skills. Use the browser. Render constantly. Raise the bar until the result is exceptional.
