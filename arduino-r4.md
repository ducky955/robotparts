# Using the Arduino r4 wifi

 To start off, I decided to connect the parts together. Below is a list of parts I used.
 - LED light(any color is fine-just make sure to use the right resistors)
 - 1k resistor
 - 220k resistor
 - LCD light(1602A)
 - Arduino uno r4 wifi
 - about 15 wires
 - breadboard

 To get started:
 First, I connected the arduino to the breadboard.
 - 5v > +
 - GND > -
 - 2> D7
 - 3 > D6
 - 4 > D5
 - 5 > D4
 - 11 > E
 - 12 > RS
 - GND > RW
 - VSS > -
 - VDD > +
 - K > -
 - A > 220 RESISTOR > +
 - VO > 1K RESISTOR > -
 - 13 > RESISTOR > LED+
 - LED- > -

 After pinning this out, lets work on code. I wrote some code(arduinor4.ino), and compiled it onto the arduino. This is just basic code, so feel free to edit it on your own computer. 

 ### IMPORTANT!!    
  The code may not work unless you change a few things. First, Change your Wifi SSID and password to your own, by replacing "YOUR_SSID" and "PASSWORD". Also, please change the IP adress in line 17 to your server's local IP.