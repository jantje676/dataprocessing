#!/usr/bin/env python
# Name: Kenneth Goei
# Student number: 11850701
"""
This script scrapes IMDB and outputs a CSV file with highest rated tv series.
"""

import csv
from requests import get
from requests.exceptions import RequestException
from contextlib import closing
from bs4 import BeautifulSoup

TARGET_URL = "http://www.imdb.com/search/title?num_votes=5000,&sort=user_rating,desc&start=1&title_type=tv_series"
BACKUP_HTML = 'tvseries.html'
OUTPUT_CSV = 'tvseries.csv'

def extract_tvseries(dom):
    """
    Extract a list of highest rated TV series from DOM (of IMDB page).
    Each TV series entry should contain the following fields:
    - TV Title
    - Rating
    - Genres (comma separated if more than one)
    - Actors/actresses (comma separated if more than one)
    - Runtime (only a number!)
    """
    tvseries = []

    # find al the tvserie objects
    content = dom.find_all("div", "lister-item-content")

    # get the information from every tvserie
    for serie in content:

        # get the tv title
        tv_title = serie.h3.a.string.encode("utf-8")
        tv_title = str(tv_title)[2:-1]

        # get the rating
        rating = serie.div.div['data-value']

        # get the genre
        genre = serie.find("p", "text-muted").find("span", "genre").string.encode("utf-8")
        genre = str(genre)[4:-1].strip()

        # get the actors
        actors = serie.p.find_next_sibling("p").find_next_sibling("p").stripped_strings
        actors_string = ""

        # add all the actors together
        for actor in actors:
            actors_string += actor

        # strip the sentece
        actors_string = str(actors_string.encode("utf-8"))[8:-1]

        # get the runtime
        runtime = serie.find("p", "text-muted").find("span", "runtime").string.encode("utf-8")
        runtime = str(runtime)[2:-4]

        # save the information
        temp = {"tv_title" : tv_title, "rating" : rating, "genre" : genre, "actors" : actors_string, "runtime" : runtime}
        tvseries.append(temp)

    return tvseries   # REPLACE THIS LINE AS WELL AS APPROPRIATE


def save_csv(outfile, tvseries):
    """
    Output a CSV file containing highest rated TV-series.
    """
    writer = csv.writer(outfile)
    writer.writerow(['Title', 'Rating', 'Genre', 'Actors', 'Runtime'])

    # write the information to the .csv file
    for tvserie in tvseries:
        writer.writerow([tvserie["tv_title"], tvserie["rating"], tvserie["genre"], tvserie["actors"], tvserie["runtime"]])



def simple_get(url):
    """
    Attempts to get the content at `url` by making an HTTP GET request.
    If the content-type of response is some kind of HTML/XML, return the
    text content, otherwise return None
    """
    try:
        with closing(get(url, stream=True)) as resp:
            if is_good_response(resp):
                return resp.content
            else:
                return None
    except RequestException as e:
        print('The following error occurred during HTTP GET request to {0} : {1}'.format(url, str(e)))
        return None


def is_good_response(resp):
    """
    Returns true if the response seems to be HTML, false otherwise
    """
    content_type = resp.headers['Content-Type'].lower()
    return (resp.status_code == 200
            and content_type is not None
            and content_type.find('html') > -1)


if __name__ == "__main__":

    # get HTML content at target URL
    html = simple_get(TARGET_URL)

    # save a copy to disk in the current directory, this serves as an backup
    # of the original HTML, will be used in grading.
    with open(BACKUP_HTML, 'wb') as f:
        f.write(html)

    # parse the HTML file into a DOM representation
    dom = BeautifulSoup(html, 'html.parser')

    # extract the tv series (using the function you implemented)
    tvseries = extract_tvseries(dom)

    # write the CSV file to disk (including a header)
    with open(OUTPUT_CSV, 'w', newline='') as output_file:
        save_csv(output_file, tvseries)
