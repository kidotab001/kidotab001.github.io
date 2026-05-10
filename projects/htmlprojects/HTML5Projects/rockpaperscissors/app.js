function play(choice){
    /* Player Choice */
    document.getElementById("p-player-choice").innerHTML = "You choose " + choice + ".";
    /* Computer Choice */
    const choices = ["rock", "paper", "scissors"];
    let computer_choice = choices[Math.floor(Math.random() * choices.length)];
    document.getElementById("p-computer-choice").innerHTML = "I choose " + computer_choice + ".";
    /* Game Result */
    if (choice === computer_choice){
        document.getElementById("p-game-result").innerHTML = "It's a draw!";
    }else if (choice === "rock" && computer_choice === "scissors" || choice === "scissors" &&
         computer_choice === "paper" || choice === "paper" && computer_choice === "rock"){
        document.getElementById("p-game-result").innerHTML = "You WIN!";
    }else{
        document.getElementById("p-game-result").innerHTML = "You LOSE!";
    }
}


