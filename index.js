/*
preloading functionality
*/
// typewriting effect
function typeWriter() {
    let preloaderOutput = document.getElementById("output");
    let text = "Mexican Italian Indian American British Chinese Thai Japanese Malaysian Spanish";
    let i = 0, len = text.length, prev = "";
    let type = setInterval(() => {
        if (i == len) {
            clearInterval(type);
            blinkEffect();
        }
        else {
            if (text[i] === " ")
                prev = "";
            else {
                preloaderOutput.innerHTML = prev + text[i] + "<span id='blinker'>|</span>";
                prev = prev + text[i];
            }
            i++;
        }
    }, 200);
}
// blink effect
function blinkEffect() {
    let blinker = document.getElementById("blinker");
    let alpha = 1;
    let blinking = setInterval(() => {
        blinker.style.color = `rgba(0,0,0,${alpha})`;
        alpha = alpha ^ 1;
    }, 250);
}

/*
Fetching recipes from themealDB API
*/
let recipesDiv; // will store the div having all recipes
let allRecipes = [];    // stores all recipes as objects

// generate all uppercase alphabets, for search recipes with first letter
let firstLetters = [];
for (let ascii = 65; ascii <= 90; ascii++)
    firstLetters.push(String.fromCharCode(ascii));

const baseUrl = "https://www.themealdb.com/api/json/v1/1/search.php?f=";

// all recipes have atmost 20 ingredients
const maxIngredients = 20;

// store only required fields
/* 
    fields: {strMeal(title),strArea(country of origin),strIn..(instr..),
    strMealThumb(thumbnail img), strYoutube(Youtube video link),
    {ingr1, measure1},{ingr2, measure2},....at max 20 such sub objects}

*/
const requiredField = ["strMeal", "strArea", "strInstructions",
    "strMealThumb", "strTags", "strYoutube"];

// store all individual regions, as a set --> strArea
let regions = new Set();

// fetch json data from API, insert into allRecipes[] as objects
async function fetchRecipes() {
    // Loop through all the first letters
    for (let fl of firstLetters) {
        // final url
        let finalUrl = baseUrl + fl;
        // fetch the data, returns a promise
        let response = await fetch(finalUrl);
        // parse into readable json data
        let data = await response.json();
        data = data["meals"];
        // data might be empty
        if (data) {
            // for each first letter, we get an array of objects of recipes
            for (let obj of data) {
                // empty object, gradually add the required fields
                toPush = {};
                // store all req fields
                for (let field of requiredField) {
                    if(typeof field==="string")
                        toPush[field] = obj[field];
                }
                // store all ingredients & measure in a single object
                // {ingredient:.., measure:..}
                for (let num = 1; num <= 20; num++){
                    if (obj["strIngredient" + num]) {
                        if (obj["strIngredient"] !== "")
                            toPush["ingr" + num] = {
                                strIngredient: obj["strIngredient" + num],
                                strMeasure: obj["strMeasure" + num]
                            };
                        else
                            break;
                    }
                    else
                        break;
                }
                // if the recipe has tags, split based on ',' and store as array
                if (toPush["strTags"]) 
                    toPush["strTags"] = toPush["strTags"].split(",");
                else
                    toPush["strTags"] = ["None"];
                if (toPush["strArea"])
                    regions.add(toPush["strArea"]);
                allRecipes.push(toPush);
            }
        }
    }
    
    // convert regions set into array, then sort it
    regions = Array.from(regions).sort();
    regions.unshift("All");

    // For each region, place a button to filter recipes for that region
    let filterButtons = document.getElementById("filterButtons");
    for (let area of regions) {
        filterButtons.innerHTML += `<button class="btn btn-info m-2" onclick="filterRecipes('${area}')">${area}</button>`;
    }

    // Randomly shuffle all recipes
    len = allRecipes.length;
    for (let i = len - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allRecipes[i], allRecipes[j]] = [allRecipes[j], allRecipes[i]];
    }

    // Now, we have data, add to DOM
    let outputDiv = document.getElementById("recipes");
    for (let recipe of allRecipes) {
        let col = document.createElement("div");
        col.classList.add("col");
        col.classList.add(`${recipe["strArea"]}`);
        let innerContent = `<div class="card h-100">
                            <div class="image h-80">
                                <img src="${recipe["strMealThumb"]}" class="card-img-top p-1" alt="${recipe["strMeal"]}">
                            </div>
                            <div class="card-body h-20">
                                <h4 class="card-title text-center">${recipe["strMeal"]}</h4>
                                <div class="text-center"><span class="badge rounded-pill bg-danger">${recipe["strArea"]}</span></div>
                            </div>
                            <div class="moreDetailsDiv d-flex justify-content-center align-items-center">
                                <div>
                                    <h1 class="text-center">${recipe["strMeal"]}</h1>
                                    <button id='${recipe["strMeal"]}' onclick='moreDetails(this.id)'
                                    class="btn btn-outline-light d-block w-100"
                                    data-bs-toggle="modal" data-bs-target="#moreDetailsModal">More details</button>
                                </div>
                            </div>
                        </div>`;
        col.innerHTML = innerContent;
        outputDiv.appendChild(col);
    }
    
    recipesDiv = document.getElementById("recipes").childNodes;
    // Now, since elements are added to DOM, stop the preloader
    let pre = document.getElementById("pre");
    pre.className = "";
    pre.style.display = "none";
    // Show the logo 
    let logo = document.getElementById("logo");
    logo.style.display = "block";
    // Show the footer
    document.getElementById("footer").style.display = "block";
    // Show the search bar
    let search = document.getElementById("search");
    search.style.display = "block";
    let regionName = document.getElementById("regionName");
    regionName.style.display = "block";
}
fetchRecipes();

// function to display recipes based on name: by default: all recipes
function filterRecipes(filterBy) {
    // If user is filtering by country, show that country name
    let regionName = document.getElementById("regionName");
    regionName.innerHTML = "Or Filter recipes by country : ";
    if (filterBy !== "input" && filterBy !== "All")
        regionName.innerHTML += filterBy;
    if (filterBy)
        filterBy = filterBy.toLowerCase();
    // incase user types in the search input, we need to show only those
    if (filterBy === "input")
        filterBy = "all";   // this variable searches for countries
    let showing = 0;
    let recipeNameToBeSearched = document.getElementById("searchInput").value;
    if (recipeNameToBeSearched)
        recipeNameToBeSearched = recipeNameToBeSearched.toLowerCase();
    for (let recipe of recipesDiv) {
        let text = recipe.childNodes[0].childNodes[3].childNodes[1].innerHTML;  // get the recipe name
        text = text.toLowerCase();
        // if recipename matches input filter(atleast "") & region filter(atleast "all"), display it
        if (text.indexOf(recipeNameToBeSearched) >= 0 || recipeNameToBeSearched === "") {
            if (recipe.classList[1].toLowerCase() === filterBy || filterBy === "all") {
                recipe.style.display = "block";
                showing++;
            }
            else
                recipe.style.display = "none";
        }
        else
            recipe.style.display = "none";
    }
    // if there are no recipes matching the filter, display the noRecipesDiv
    let noRecipesDiv = document.getElementById("noRecipes");
    if (showing == 0)
        noRecipesDiv.style.display = "block";
    else
        noRecipesDiv.style.display = "none";
}

// function to display complete details for a recipe
function moreDetails(recipeName) {
    // search for that recipe in the allRecipes array
    let recipe = allRecipes.filter((curr) => {
        return curr["strMeal"] === recipeName;
    });
    // since .filter() returns an array, our recipe will be at recipe[0]
    recipe = recipe[0];
    // show the data at all placeholders
    let title = document.getElementById("recipeTitle");
    title.innerHTML = recipe["strMeal"];
    let region = document.getElementById("region");
    region.innerHTML = "Region: " + recipe["strArea"];
    let tags = document.getElementById("tags");
    tags.innerHTML = "Tags: " + recipe["strTags"];
    let instructions = document.getElementById("instructions");
    instructions.innerHTML = recipe["strInstructions"];
    let youtubeVideo = document.getElementById("youtubeVideo");
    youtubeVideo.setAttribute("href", recipe["strYoutube"]);
    // fill the ingredients table
    let tbody = document.getElementById("items").childNodes[3];
    tbody.innerHTML = "";
    for (let field in recipe) {
        if (field.indexOf("ingr") >= 0) {
            tbody.innerHTML += `<tr>
                                    <td>${recipe[field]["strIngredient"]}</td>
                                    <td>${recipe[field]["strMeasure"]}</td>
                                </tr>`;
        }
    }
}
