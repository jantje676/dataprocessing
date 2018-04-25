import csv
import json

# open files
csvfile = open("gasten.csv", "r")
jsonfile = open("gasten.json", "w")

# fill in keys for dict
fieldnames = ("Provincie", "Gasten")

# start reader
reader = csv.DictReader(csvfile, fieldnames)

# skip header
next(reader, None)

out = json.dumps( [ row for row in reader ] )
jsonfile.write(out)
