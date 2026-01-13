# How did I make the server?

To make the server, I first downloaded Node.js, so i could run this in the background of my home computer. After downloading that, I created a directory with node.js. ![alt text](image.png)

I then created a server.js file in the directory, and created the code for a simple server(simple framwork code). 
## How the code works:
The code essentialy hosts a small webserver on my computer, with a 3 things. 

1- A device list
(This tells the you-or whoever is using the admin panel-what devices are connected to the server. Keep in mind that in order for the device to show, it has to be sending a response code to the server, so just veiwing the webpage on your computer wont work, there has to be some sort of commuication from the microcontroller to the server)

2- The chat log
(This is just a simple chat log, which saves your texts. Right now, it does not save, so if you restart the program, the chat will restart, and the messgaes will ALL clear. I am working on fixing that.)

3- The chat-box
(The user interface. Type your messages, and they will send. Right now, the messages have to be within a 32 character limit, as they will cut off due to space restrictions, however I am working on adding a scrolling feature.)