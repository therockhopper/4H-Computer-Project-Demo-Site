from math import gcd
import time


print("What's the whole?")
whole = input()
whole = int(whole)

print("How many out of " + str(whole) + "?")
fraction = input()
fraction = int(fraction)

# reduce the fraction
def reduce_fraction(a, b):
    g = gcd(a, b)
    return a // g, b // g

# calculate percent
percent = (fraction / whole * 100) if whole else 0

print("Percent:", percent)
print("Reduced fraction:", reduce_fraction(fraction, whole))
print("close")
stall = input()
while stall != "yes":
    from math import gcd
    import time

    print("What's the whole?")
    whole = input()
    whole = int(whole)

    print("How many out of " + str(whole) + "?")
    fraction = input()
    fraction = int(fraction)

# reduce the fraction
    def reduce_fraction(a, b):
        g = gcd(a, b)
        return a // g, b // g

# calculate percent
    percent = (fraction / whole * 100) if whole else 0

    print("Percent:", percent)
    print("Reduced fraction:", reduce_fraction(fraction, whole))
    print("close")
    stall = input()

    