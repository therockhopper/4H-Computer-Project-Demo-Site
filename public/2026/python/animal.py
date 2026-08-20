animal_type = input('what animal do you want (dog or cat) MAKE SURE YOU DONT PUT A SPACE')
if animal_type != 'dog' and animal_type != 'cat':
    print("invaled option")
else:
 animal_name = input('what would you like to name your ' + animal_type)
print('this is your ' + animal_type  + animal_name)  
if  animal_type == 'cat':
  print(''' ^____^
(o . o)
( " " ) ''')
else: 
  print('''  _____
V(o ᴥ o)V
 ( " " )''') 
  
