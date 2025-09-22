# Mooterview Frontend Bugs Report

### 1. No Language Selection - Stuck with Python Only

**What's happening:**
When I finally get to a problem page (after all the clicking struggles), I notice there's no way to change the programming language. It's just stuck on Python. I look around for a dropdown or language selector like you see on LeetCode, HackerRank, or CodeForces, but there's nothing. Just Python, take it or leave it.

**Why this is limiting:**
- I prefer coding in JavaScript/Java/C++ but can't switch
- If I'm learning a new language, I'm stuck with Python only
- Other platforms let you practice the same problem in different languages
- Makes the platform way less useful for people who don't use Python
- If this is supposed to be a general coding practice site, it should support multiple languages

**What's probably missing:**
There should be a language dropdown somewhere near the code editor. Most coding platforms have this right above or next to the editor. Maybe the backend supports multiple languages but the frontend just doesn't have the UI for it? Or maybe it's only designed for Python users and that's intentional?

**My question:**
Is Mooterview specifically made for Python developers only? If so, that should be clear from the homepage. If not, then we definitely need language selection options.

### 2. No Test Cases = No Way to Check My Work

**What's happening:**
Even if I somehow get the editor working (which rarely happens), there are no test cases shown anywhere. I write some code but have absolutely no way to test it or see if it's working. The bottom of the page where test cases should be is just... empty.

**Why this makes no sense:**
- How am I supposed to know if my solution is correct?
- Every other coding platform shows test cases
- I'm basically coding blind with no feedback
- Can't learn from mistakes because I don't know what's wrong
- Even if ai is there for that, but any normal user would prefer manual test cases instead of relying on AI to tell me if my code is right or wrong. and mind that AI isn't perfect either.

**Probably what's broken:**
Either the backend isn't sending test case data, or the frontend isn't displaying it. Maybe the API call for the problem data is missing the test cases, or there's a component that should show them but it's not rendering. Could also be that the test cases are there but hidden by CSS or something.
