let valid_guesses = null;
let valid_answers = null;
let bad_letters = [];
let good_letters = [];
let wrong_position = [[], [], [], [], []];
let solved_letters = [null, null, null, null, null];
let current_guess = 0;

async function read_txt_webpage(url) {
  const response = await fetch(url);
  const data = await response.text();
  return data;
}

let guesses_url = "wordle_guesses.txt"
const guesses_promise = read_txt_webpage(guesses_url).then(function(result) {
  valid_guesses = result.split("\n");
});

let answers_url = "wordle_answers.txt"
const answers_promise = read_txt_webpage(answers_url).then(function(result) {
  valid_answers = result.split("\n");
});

function enter_guess(word) {
  ++current_guess;
  /* DEBUG
  console.log(current_guess);
  console.log("#guess" + current_guess);
  //*/
  $("#guess" + current_guess).children().each(function(index) {
    $(this).html(word[index]);
    // mark letter correct if it was correct before
    if (current_guess > 1) {
      let was_correct = false;
      // check if it was correct before
      $("#guess" + parseInt(1*current_guess - 1)).children().each(function(jndex) {
        if (index == jndex) {
          // it was correct before
          if ($(this).hasClass("definitely")) {
            was_correct = true;
          }
        }
      });
      if (was_correct) {
        $(this).addClass("definitely");
      }
    }
  });
}

function check_guess() {
  let marked_answers = [];
  let marked_guesses = [];
  // check the state of every character
  $("#guess" + current_guess).children().each(function(index) {
    // character in the correct position
    if ($(this).hasClass("definitely")) {
      // remove from bad letters if listed in there
      if (bad_letters.includes($(this).html())) {
        let i = bad_letters.indexOf($(this).html());
        //* DEBUG 
        console.log("Removing " + $(this).html() + " from list of bad letters");
        //*/
        bad_letters.splice(i, 1);
      }
      //* DEBUG
      console.log("Adding " + $(this).html() + " to list of solved letters in position " + index);
      //*/
      solved_letters[index] = $(this).html();
    // character not in correct position, but somewhere in the word
    } else if ($(this).hasClass("maybe")) {
      // remove from bad letters if listed in there
      if (bad_letters.includes($(this).html())) {
        let i = bad_letters.indexOf($(this).html());
        //* DEBUG 
        console.log("Removing " + $(this).html() + " from list of bad letters");
        //*/
        bad_letters.splice(i, 1);
      }
      //* DEBUG
      console.log("Adding " + $(this).html() + " to list of good letters");
      console.log("Adding " + $(this).html() + " to list of wrong position letters in position " + index);
      //*/
      good_letters.push($(this).html());
      wrong_position[index].push($(this).html());
    // character not in final word
    } else {
      // check if letter is in list of wrong position letters
      let is_wrong_position = false;
      for (i in wrong_position) {
        if (wrong_position[i].includes($(this).html())) {
          is_wrong_position = true;
        }
      }
      if (is_wrong_position) {
        let i = bad_letters.indexOf($(this).html());
        //* DEBUG
        console.log("removing " + $(this).html() + " from list of bad letters because it's just in the wrong position");
        //*/
        bad_letters.splice(i, 1);
        // add the letter to wrong position list because this one is *also* in the wrong position
        //* DEBUG
        console.log("Adding " + $(this).html() + " to list of wrong position letters in position " + index);
        //*/
        wrong_position[index].push($(this).html());
      // don't include in bad letters if letter is locked in elsewhere in word
      } else if (!solved_letters.includes($(this).html())) {
        //* DEBUG
        console.log("Adding " + $(this).html() + " to list of bad letters");
        //*/
        bad_letters.push($(this).html());
      }
    }
    //* DEBUG
    console.log("good letters: " + good_letters);
    console.log("wrong position letters: " + wrong_position);
    console.log("bad letters: " + bad_letters);
    //*/
  });

  // remove stuff from valid if it conflicts with the guess
  // order of these actions may affect execution speed
  // something to maybe consider for later
  for (const i in valid_answers) {
    let already_marked = false;
    let word = valid_answers[i];

    // check if the word contains any of the good letters
    for (const j in good_letters) {
      // mark for deletion if good letter NOT found
      if (!word.includes(good_letters[j])) {
        //* DEBUG
        console.log(word + " removed because it does not contain " + good_letters[j]);
        //*/
        marked_answers.push(i);
        already_marked = true;
        break;
      }
    }

    if (already_marked) {
      continue;
    }

    // check if the word contains any of the bad letters
    for (const j in bad_letters) {
      // mark for deletion if bad letter found
      if (word.includes(bad_letters[j])) {
        //* DEBUG
        console.log(word + " removed because it does contain " + bad_letters[j]);
        //*/
        marked_answers.push(i);
        already_marked = true;
        break;
      }
    }

    if (already_marked) {
      continue;
    }

    // check if any letters are in the wrong position
    for (const j in wrong_position) {
      for (const k in wrong_position[j]) {
        // mark for deletion if letter is in the wrong position
        if (word[j] == wrong_position[j][k]) {
          //* DEBUG
          console.log(word + " removed because " + word[j] + " found in position " + 1*j+1);
          //*/
          marked_answers.push(i);
          already_marked = true;
          break;
        }
      }
      if (already_marked) {
        break;
      }
    }

    if (already_marked) {
      continue;
    }

    // check if any solved letters are correct
    for (const j in solved_letters) {
      // mark for deletion if any solved letters do not match the word
      if (solved_letters[j] !== null && word[j] !== solved_letters[j]) {
        //* DEBUG
        console.log(word + " removed because letter " + solved_letters[j] + " needs to be in position " + parseInt(j+1));
        //*/
        marked_answers.push(i);
        already_marked = true;
        break;
      }
    }
  }

  // remove the marked answers
  /* DEBUG
  console.log("marked_answers:");
  console.log(JSON.stringify(marked_answers));
  //*/
  while (marked_answers.length > 0) {
    let i = marked_answers.pop();
    /* DEBUG
    console.log("removing " + valid_answers[i] + " from position " + i);
    //*/
    valid_answers.splice(i, 1);
  }

  //* DEBUG: print list of current valid answers
  console.log(JSON.stringify(valid_answers));
  //*/
}

function find_word() {
  // just return a random word for now
  let index = Math.floor(Math.random() * valid_answers.length)
  let word = valid_answers[index];
  // remove from word list before returning
  valid_answers.splice(index, 1);
  return word;
}

function keyboard_input(key_press) {
  let element = null;
  // delete last character
  if (key_press == "DEL") {
    let last_letter = 0;  
    // find the last character
    $("#guess" + parseInt(current_guess + 1)).children().each(function(index) {
      if ($(this).html() !== "" && last_letter < 5) {
        ++last_letter;
        /* DEBUG
        console.log("last letter: " + last_letter);
        //*/
      }
    });
    // remove the last character
    if (last_letter !== 0) {
      let current_letter = 0;
      $("#guess" + parseInt(current_guess + 1)).children().each(function(index) {
        ++current_letter;
        /* DEBUG
        console.log("current letter " + current_letter);
        //*/
        if (current_letter == last_letter) {
          $(this).html("");
        }
      });
    }
  // enter new character
  } else {
    $("#guess" + parseInt(current_guess + 1)).children().each(function(index) {
      // find the first empty box
      if ($(this).html() == "") {
        if (element == null) {
          element = this;
        }
      }
    });
    // enter a letter in the box
    $(element).html(key_press);
  }
}

function validate_guess(word) {
  $("#guess" + current_guess).children().each(function(index) {
    // mark as definitely
    if ($(this).html() == word[index]) {
      //* DEBUG
      console.log("Marking as definitely because " + word[index] + " found in position " + index);
      //*/
      $(this).addClass("definitely")
    // mark as maybe
    } else if (word.includes($(this).html())) {
      console.log("Marking as maybe because " + $(this).html() + " found in word");
      $(this).addClass("maybe");
    }
  });
}

function submit_word() {
  // only do if no guesses
  if (current_guess > 0) {
    return;
  }
  // validate the word in the text box
  let word = $("#target_word").val().toUpperCase();
  console.log(word);
  // check if it's 5 characters
  // TODO this should be removed later and replaced with actual input validation
  if (word.length !== 5) {
    console.log("Word length not valid");
    return;
  }
  // check if the word is a valid answer
  if (!valid_answers.includes(word)) {
    console.log("Word isn't a valid answer");
    return;
  }

  // word is valid so now solve it
  // make a guess

  // solve it
  let answer_found = false;
  while (current_guess < 6 && answer_found == false) {
    let guess = find_word();
    enter_guess(guess);
    validate_guess(word);
    check_guess();
    if (word == guess) {
      answer_found = true;
    }
  }
}

$(document).ready(function() {
  // change letter class when clicked
  $(".word").children().click(function() {
    if ($(this).hasClass("definitely")) {
      $(this).removeClass("definitely");
    } else if ($(this).hasClass("maybe")) {
      $(this).removeClass("maybe");
      $(this).addClass("definitely");
    } else {
      $(this).addClass("maybe");
    }
  });

  // get the next guess when button is clicked
  $("#next_guess").click(function() {
    // check if a word has been entered by the user
    let users_word = "";
    let users_word_is_valid = false;
    $("#guess" + parseInt(current_guess + 1)).children().each(function() {
      users_word = users_word.concat($(this).html());
    });
    //* DEBUG
    console.log("entered word is: " + users_word);
    //*/
    // check if word is valid
    if (users_word.length !== 5) {
      console.log("Entered word is not correct length.");
    } else if (!valid_guesses.includes(users_word) && !valid_answers.includes(users_word)) {
      console.log("Entered word is not a valid guess");
    // word is probably valid unless I missed some constraint
    } else {
      users_word_is_valid = true;
    }
    check_guess();

    let new_guess = "";
    // use submitted word if it's valid
    if (users_word_is_valid) {
      new_guess = users_word;
    // find new word otherwise
    } else {
      new_guess = find_word();
    }

    enter_guess(new_guess);
  });

  $(this).keydown(function(e) {
      // unclear if this line is needed
      //e.preventDefault();
      // don't input letter if typing in text box
      if ($(e.target).closest("#target_word")[0]) {
        return;
      }

      if (e.keyCode >= 60 && e.keyCode <= 90) {
        keyboard_input(e.key.toUpperCase());
      } else if (e.key == "Backspace") {
        keyboard_input("DEL");
      }
    });
});

$.when(guesses_promise, answers_promise).done(function(){
  /* DEBUG
  enter_guess("TURBO");
  //*/
  // enter a guess to start (just for now)
  //enter_guess(find_word());
});