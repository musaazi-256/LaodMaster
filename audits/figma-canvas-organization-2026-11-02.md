# Figma mobile canvas organization

Rearranged customer and driver pages so Home is the first flow at the top. Review states progress left to right, then down, with iOS and Android beside each other. Every screen has an ordered canvas label. Booking/requests, tracking, completion, history, payments and account flows now follow a clear top-to-bottom sequence.

Moved reusable components into a separate component area to the right. Reused screen IDs and retained prototype connections. Flow sections and note panels were resized to match their new groups. Full geometry and positions are recorded in design/figma/canvas-layout-review.json.

Verification: all 74 customer and 50 driver screens accounted for; zero screen-to-screen bounding-box intersections after reflow. All 370 customer and 174 driver navigation actions still resolve to valid top-level frames. Visual overview checks confirmed the Home-first layout and separate platform lanes. An optional note-direction update encountered a Figma transport interruption after the core layout and interaction audits had passed.
