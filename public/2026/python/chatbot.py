print("hello world")
print("whats your name")
name = input()

print("hello " + name + " how are you doing")
emotion = input().lower()

if emotion == "good":
    print("thats good")

elif emotion == "pretty okay":
    print("that's cool")
    
elif emotion == "execute order 66":
    print("yes your leige")

elif emotion == "bad" or "horrible" or "lowsey":
    print("oh no what happen did goose attack")

    answer1 = input().lower()

    while answer1 != "yes" and answer1 != "no":
        print("listen here buddy I KNOW WHERE YOU LIVE so I asked you a question DID THE GOOSE ATTACK")
        answer1 = input().lower()
    if answer1 ==("yes"):
        print("good")
