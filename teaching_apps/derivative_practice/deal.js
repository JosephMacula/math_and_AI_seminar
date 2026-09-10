/* Which problem comes next.  Kept out of app.js, which is all DOM and cannot
   be reached from tests.js, because a shuffled bag is easy to get quietly
   wrong -- a biased shuffle, a problem repeating the moment it was just
   answered, a bag that deals the same index twice -- and none of those are
   visible by looking at the screen.  Here it is a pure function of a random
   source, so tests.js can drive it with a seeded one and check the claims. */

/* Fisher-Yates from the top down, which is the unbiased form: at each step the
   remaining prefix is a uniformly random arrangement.  The bag holds every
   problem exactly once, so a student sees the whole bank before anything
   repeats. */
function shuffledBag(count, avoid, random = Math.random) {
  const order = [];
  for (let index = 0; index < count; index++) order.push(index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  /* Problems are dealt off the end, so the last entry is the one handed out
     next.  It must not be the problem already on screen, or refilling the bag
     would occasionally show the same problem twice in a row. */
  const last = order.length - 1;
  if (order.length > 1 && order[last] === avoid) [order[last], order[0]] = [order[0], order[last]];
  return order;
}

if (typeof module !== "undefined") module.exports = { shuffledBag };
