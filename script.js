let helixSVG = document.getElementById('helix-svg')

let amountToOffsetToSetHelixToCenter = 200
let heightOfHelixSVG = 600
let halfHeightOfHelixSVG = heightOfHelixSVG / 2
let maxRadius = 50 // widest the helix will be

let dataOfAllStrands = {
    // example of what it looks like
    0 : {
        XRadius : 0,
        startingXAngle : 0,
        startingY : 0,
        }, 
    1 : {}
}


function populateHelix() { // adds the points and strands to the helix and fills the dataOfAllStrands obj
    let baseXRadiusIncrement = -10
    let startingXAngleIncrement = 0
    let startingYIncrement = 0
    for (let i = 0; i < 20; i++){  //21 strands
        let strandDataToAdd = {
            XRadius : 0,
            startingXAngle : 0,
            startingY : 0,
        }

        baseXRadiusIncrement = (baseXRadiusIncrement + 10) % 100

        let distanceFromCenterToChord = Math.abs(maxRadius - baseXRadiusIncrement) 
        let HalfLengthOfChord = Math.sqrt((maxRadius ** 2) - (distanceFromCenterToChord ** 2))
        strandDataToAdd.XRadius = HalfLengthOfChord

        startingYIncrement = (startingYIncrement + 30) % heightOfHelixSVG
        strandDataToAdd.startingY = startingYIncrement

        startingXAngleIncrement = (startingXAngleIncrement + 18) % 360 // 90 degree turn for every full expansion of radius
        strandDataToAdd.startingXAngle = startingXAngleIncrement

        

        dataOfAllStrands[i] = strandDataToAdd

        let newStrand = document.createElementNS("http://www.w3.org/2000/svg", "g")
        newStrand.dataset.id = i

        let leftHash = document.createElementNS("http://www.w3.org/2000/svg", "text")
        leftHash.innerHTML = '#'
        let rightHash = document.createElementNS("http://www.w3.org/2000/svg", "text")
        rightHash.innerHTML = '#'

        newStrand.appendChild(leftHash)
        newStrand.appendChild(rightHash)
        
        if (HalfLengthOfChord === 0){ // if its a pinch point
            newStrand.removeChild(rightHash)
            leftHash.style.fillOpacity = 0.6
            leftHash.style.fontSize = 36 + 'px'
            leftHash.setAttribute('x', amountToOffsetToSetHelixToCenter)
        }

        const radiusToCharBetweenNumberRelation = { // how many things between go with each strand radius
            50 : 10,
            48 : 9,
            45 : 8,
            40 : 7,
            30 : 5
        }

        for (let n = 0; n < radiusToCharBetweenNumberRelation[Math.floor(strandDataToAdd.XRadius)]; n++){ // add things between
            let newCharBetween = document.createElementNS("http://www.w3.org/2000/svg", "text")
            newCharBetween.innerHTML = 'o'
            newStrand.insertBefore(newCharBetween, rightHash)
        }


        helixSVG.appendChild(newStrand)
    }
}

populateHelix()

///////////////////////////////////////////////////////////////////////////////////////////////////////////////// hover stuff
let cursorMoveAnimationShouldStop = false
function hoverModifyChars(event) {
    event.preventDefault()
    const hoveredElement = event.target
    if (hoveredElement.classList.contains('char-was-hovered')){
        return
    }
    cursorMoveAnimationShouldStop = true
    const hslH = Math.floor(Math.random() * 361)
    const hslS = Math.floor(Math.random() * 51) + 50
    const hslL = Math.floor(Math.random() * 51) + 25

    
    hoveredElement.style.setProperty('--hsl-to-set', `hsl(${hslH}, ${hslS}%, ${hslL}%)`)

    const XToJumpTo = (currentCursorPosition[0] - previousCursorPosition[0]) * 4
    const YToJumpTo = (currentCursorPosition[1] - previousCursorPosition[1]) * 4

    hoveredElement.style.setProperty('--coords-to-jump-to', `${XToJumpTo}px ${YToJumpTo}px`)

    hoveredElement.classList.add('char-was-hovered')
}
for (let strand of helixSVG.querySelectorAll('g')){
    for (let char of strand.children){
        char.addEventListener('mouseenter', hoverModifyChars)
        char.addEventListener('touchmove', hoverModifyChars)
        char.addEventListener('animationend', (event) => {
            event.target.classList.remove('char-was-hovered')
        })
    }
}

let boundingClient = helixSVG.getBoundingClientRect()
let scrollDebounceTimer 
window.addEventListener('scroll', (e) => {  // we get the rect on scroll so we dont have to get it so often when moving the mouse
    if (scrollDebounceTimer){
        clearTimeout(scrollDebounceTimer)
    }
    scrollDebounceTimer = setTimeout(() => {
            boundingClient = helixSVG.getBoundingClientRect()
            console.log('after 100ms of no scrolling got rect')
        }, 100)

    
})

let currentCursorPosition = [0, 0]
let previousCursorPosition = [0, 0]
function getCursorImpactDetails(event) {  //estalishes mouse position to use in the modifyChars
    previousCursorPosition = currentCursorPosition.slice()
    currentCursorPosition = [event.clientX - boundingClient.left, event.clientY - boundingClient.top]
}

function getCursorImpactDetailsTouch(event) {  // same but for touch
    if (event.touches.length == 1){
        event.preventDefault()
        event.stopPropagation()
    }

    else {
        return
    }

    const thisTouch = event.touches[0]

    previousCursorPosition = currentCursorPosition.slice()
    currentCursorPosition = [thisTouch.clientX - boundingClient.left, thisTouch.clientY - boundingClient.top]
    console.log(currentCursorPosition, previousCursorPosition)
}

helixSVG.addEventListener('mousemove', getCursorImpactDetails)
helixSVG.addEventListener('touchmove', getCursorImpactDetailsTouch)
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO we can do optimisation later. currently it adds 0.7 GHz to cpu
// the optimisations would be: have a dict for every position and detail so that you dont have to caluclate it all.

const universalBaseRadius = 50
let universalX = 0
let universalY = 0
let universalAngle = 0

function renderHelixFrame() {
    function applyParticularDetailsToStrand(textStrand) { // this deduces the particular values from the universal ones and applies the position and stlying to the particular strand.
        const strandDetails = dataOfAllStrands[Number(textStrand.dataset.id)]
        
        if (strandDetails.XRadius === 0){ // if its the one at the pinch point
            textStrand.children[0].setAttribute('y', (universalY + strandDetails.startingY) % heightOfHelixSVG)
            return
        }

        //////////////////////////////////////////////////////////////////////// calculations
        const currentAngleOfThisPoint = (universalAngle + strandDetails.startingXAngle) % 360

        const particularXradius = strandDetails.XRadius
        const particularX = particularXradius * Math.sin(Math.PI * 2 * currentAngleOfThisPoint / 360)

        // const baseDepthValue = (Math.sin(Math.PI * 2 * (currentAngleOfThisPoint - 90) / 360) + 1) / 2 // eg 0.3 // this commented out stuff is the old way.
        // console.log(particularXradius, baseDepthValue)
        // const fractionOfTotalRadius = (1 - ((maxRadius - (particularXradius / 1.5)) / 100)) // here the 1.5 is the 'fog' value.
        // const newRange = fractionOfTotalRadius - (1 - fractionOfTotalRadius) 
        // const particularDepth = (1 - fractionOfTotalRadius) + (newRange * baseDepthValue)

        const baseDepthValue = (Math.sin(Math.PI * 2 * ((currentAngleOfThisPoint - 90) / 360)) + 1) / 2// eg 0.3
        const fractionOfTotalRadius = (particularXradius / maxRadius)
        const newRange = fractionOfTotalRadius - (1 - fractionOfTotalRadius)
        const particularDepth = (newRange * baseDepthValue) + (1 - fractionOfTotalRadius)

        const baseY = (universalY + strandDetails.startingY) % heightOfHelixSVG
        const particularYradius = (baseY - halfHeightOfHelixSVG) * 0.05 // here 0.05 is the steepness of the perspective
        const particularY = particularYradius * Math.sin(Math.PI * 2 * (currentAngleOfThisPoint - 90) / 360)
        ////////////////////////////////////////////////////////////////////////

       
        //////////////////////////////////////////////////////////////////////// establish furthest end of strings, things in between are at steps between these.
        const leftmostX = particularX  
        const rightmostX = particularX * -1

        const leftmostOpacity = particularDepth + 0.1  // here 0.1 is the 'fog' value
        const rightmostOpacity = 1 - particularDepth + 0.1

        const leftmostFontSize = (particularDepth + 3) * 10.5
        const rightmostFontSize = (1 - particularDepth + 3) * 10.5

        const leftmostY = baseY + particularY
        const rightmostY = baseY + (particularY * -1)
        ////////////////////////////////////////////////////////////////////////

        const textStrandChildren = textStrand.children
        // handle x position
        textStrandChildren[0].setAttribute('x', leftmostX + amountToOffsetToSetHelixToCenter) // the plus amountToOffsetToSetHelixToCenter just puts it in the middle 
        textStrandChildren[textStrandChildren.length - 1].setAttribute('x', rightmostX + amountToOffsetToSetHelixToCenter)

        // handle y position
        textStrandChildren[0].setAttribute('y', leftmostY) 
        textStrandChildren[textStrandChildren.length - 1].setAttribute('y', rightmostY)

        //handle opacity 
        textStrandChildren[0].style.fillOpacity = leftmostOpacity
        textStrandChildren[textStrandChildren.length - 1].style.fillOpacity = rightmostOpacity

        //handle font size 
        textStrandChildren[0].style.fontSize = leftmostFontSize + 'px'
        textStrandChildren[textStrandChildren.length - 1].style.fontSize = rightmostFontSize + 'px'


        const evenSliceOfTotalX = Math.abs((leftmostX - rightmostX) / (textStrandChildren.length - 1))
        const evenSliceOfTotalY = Math.abs((leftmostY - rightmostY) / (textStrandChildren.length - 1))
        const evenSliceOfTotalOpacity = Math.abs((leftmostOpacity - rightmostOpacity) / (textStrandChildren.length - 1))
        const evenSliceOfTotalFontSize = Math.abs((leftmostFontSize - rightmostFontSize) / (textStrandChildren.length - 1))
        for (let i = 1; i < textStrandChildren.length - 1; i++){ // loop for in betweens, skips #s
            // handle x position
            const sliceOfTotalX = evenSliceOfTotalX * i
            const XBetween = (leftmostX < rightmostX) ? leftmostX + sliceOfTotalX : leftmostX - sliceOfTotalX
            textStrandChildren[i].setAttribute('x', XBetween + amountToOffsetToSetHelixToCenter + 4.5)  // + 4.5 is relative to font-size 

            // handle y position
            const sliceOfTotalY = evenSliceOfTotalY * i
            const YBetween = (leftmostY < rightmostY) ? leftmostY + sliceOfTotalY : leftmostY - sliceOfTotalY
            textStrandChildren[i].setAttribute('y', YBetween - 7) 

            //handle opacity
            const sliceOfTotalOpacity = evenSliceOfTotalOpacity * i
            const opacityBetween = (leftmostOpacity < rightmostOpacity) ? leftmostOpacity + sliceOfTotalOpacity : leftmostOpacity - sliceOfTotalOpacity
            textStrandChildren[i].style.fillOpacity = opacityBetween

            //handle font size
            const sliceOfTotalFontSize = evenSliceOfTotalFontSize * i
            const fontSizeBetween = (leftmostFontSize < rightmostFontSize) ? leftmostFontSize + sliceOfTotalFontSize : leftmostFontSize - sliceOfTotalFontSize
            textStrandChildren[i].style.fontSize = fontSizeBetween / 2 + 'px'
        }
    }

    universalAngle = (universalAngle + 1) % 360
    universalY = (universalY + 0.5) % heightOfHelixSVG

    for (let textStrand of helixSVG.querySelectorAll('g')){
        applyParticularDetailsToStrand(textStrand)
    }

    window.requestAnimationFrame(renderHelixFrame)
}

window.requestAnimationFrame(renderHelixFrame)

// cursor move animation encouragement on helix
document.getElementById('cursor-animation-image').addEventListener('animationiteration', (e) => {
    if (cursorMoveAnimationShouldStop){
        e.target.style.animationName = 'none'
        e.target.style.visibility = 'hidden'
    }
})

////////////////////////////////////////////////////////////////////////////////////// HELIX ENDS HERE



// button animation
const allButtons = document.querySelectorAll('button')
for (let button of allButtons){
    // add click animatino
    button.addEventListener('click', (e) => {
        const buttonGhost = document.createElement('div')
        buttonGhost.classList.add('button-ghost')
        e.target.appendChild(buttonGhost)
        setTimeout(() => {
            e.target.removeChild(buttonGhost)
        }, 200)
        if (e.target.dataset.destination != 'scroll'){
            window.open(e.target.dataset.destination, '_blank')
        }
        else {
            const heightOfHeader = document.querySelector('header').offsetHeight
            window.scrollTo({top: heightOfHeader, behavior: 'smooth'});
        }

    })
}

// stuff slides in on scroll
const observer = new IntersectionObserver((entries) => {
    for (let entry of entries){
        if (entry.isIntersecting){
            entry.target.classList.add('is-shown')
        }
        else {
            entry.target.classList.remove('is-shown')
        }
    }
})

function observeAll() {
    for (let headerText of document.getElementById('header-stuff-div').children[0].children){
        observer.observe(headerText)
    }
    
    for (let skillIcon of document.getElementById('skills-icon-div').children){
        observer.observe(skillIcon)
    }
    
    observer.observe(document.getElementById('header-buttons-div'))
    
    setTimeout(() => {
        for (let project of document.querySelectorAll('.project-box')){
            observer.observe(project)
        }
    }, 600)
    
    observer.observe(document.getElementById('cv-div'))
}




// loader
const screenCover = document.getElementById('loader-div')
setTimeout(() => {
    screenCover.style.opacity = 0
    observeAll()
    setTimeout(() => {
        document.body.removeChild(screenCover)
    }, 500)
}, 1000)
