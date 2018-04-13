#!/usr/bin/env python
# Name:Kenneth Goei
# Student number: 11850701
"""
This script crawls the IMDB top 250 movies.
"""

import os
import csv
import codecs
import errno

from requests import get
from requests.exceptions import RequestException
from contextlib import closing
from bs4 import BeautifulSoup

# global constants
TOP_250_URL = 'http://www.imdb.com/chart/top'
OUTPUT_CSV = 'top250movies.csv'
SCRIPT_DIR = os.path.split(os.path.realpath(__file__))[0]
BACKUP_DIR = os.path.join(SCRIPT_DIR, 'HTML_BACKUPS')

# --------------------------------------------------------------------------
# Utility functions (no need to edit):


def create_dir(directory):
    """
    Create directory if needed.
    Args:
        directory: string, path of directory to be made
    Note: the backup directory is used to save the HTML of the pages you
        crawl.
    """

    try:
        os.makedirs(directory)
    except OSError as e:
        if e.errno == errno.EEXIST:
            # Backup directory already exists, no problem for this script,
            # just ignore the exception and carry on.
            pass
        else:
            # All errors other than an already existing backup directory
            # are not handled, so the exception is re-raised and the
            # script will crash here.
            raise


def save_csv(filename, rows):
    """
    Save CSV file with the top 250 most popular movies on IMDB.
    Args:
        filename: string filename for the CSV file
        rows: list of rows to be saved (250 movies in this exercise)
    """
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'title', 'runtime', 'genre(s)', 'director(s)', 'writer(s)',
            'actor(s)', 'rating(s)', 'number of rating(s)'
        ])

        writer.writerows(rows)


def make_backup(filename, html):
    """
    Save HTML to file.
    Args:
        filename: absolute path of file to save
        html: (unicode) string of the html file
    """

    with open(filename, 'wb') as f:
        f.write(html)


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


def main():
    """
    Crawl the IMDB top 250 movies, save CSV with their information.
    Note:
        This function also makes backups of the HTML files in a sub-directory
        called HTML_BACKUPS (those will be used in grading).
    """

    # Create a directory to store copies of all the relevant HTML files (those
    # will be used in testing).
    print('Setting up backup dir if needed ...')
    create_dir(BACKUP_DIR)

    # Make backup of the IMDB top 250 movies page
    print('Access top 250 page, making backup ...')
    top_250_html = simple_get(TOP_250_URL)
    top_250_dom = BeautifulSoup(top_250_html, "lxml")

    make_backup(os.path.join(BACKUP_DIR, 'index.html'), top_250_html)

    # extract the top 250 movies
    print('Scraping top 250 page ...')
    url_strings = scrape_top_250(top_250_dom)

    # grab all relevant information from the 250 movie web pages
    rows = []
    for i, url in enumerate(url_strings):  # Enumerate, a great Python trick!
        print('Scraping movie %d ...' % i)

        # Grab web page
        movie_html = simple_get(url)

        # Extract relevant information for each movie
        movie_dom = BeautifulSoup(movie_html, "lxml")
        rows.append(scrape_movie_page(movie_dom))

        # Save one of the IMDB's movie pages (for testing)
        if i == 83:
            html_file = os.path.join(BACKUP_DIR, 'movie-%03d.html' % i)
            make_backup(html_file, movie_html)

    # Save a CSV file with the relevant information for the top 250 movies.
    print('Saving CSV ...')
    save_csv(os.path.join(SCRIPT_DIR, 'top250movies.csv'), rows)


# --------------------------------------------------------------------------
# Functions to adapt or provide implementations for:

def scrape_top_250(soup):
    """
    Scrape the IMDB top 250 movies index page.
    Args:
        soup: parsed DOM element of the top 250 index page
    Returns:
        A list of strings, where each string is the URL to a movie's page on
        IMDB, note that these URLS must be absolute (i.e. include the http
        part, the domain part and the path part).
    """
    # to save the urls
    movie_urls = []

    # take the part where all the movies are
    content = soup.find("tbody", "lister-list").find_all("tr")

    # for every movie take the absolute url
    for title in content:
        url = "http://www.imdb.com" + title.find("td", "titleColumn").a["href"]
        movie_urls.append(url)

    return movie_urls


def scrape_movie_page(dom):
    """
    Scrape the IMDB page for a single movie
    Args:
        dom: pattern.web.DOM instance representing the page of 1 single
            movie.
    Returns:
        A list of strings representing the following (in order): title, year,
        duration, genre(s) (semicolon separated if several), director(s)
        (semicolon separated if several), writer(s) (semicolon separated if
        several), actor(s) (semicolon separated if several), rating, number
        of ratings.
    """
    # to save the information
    info = []

    # find the information block needed
    header = dom.find("div", "title_wrapper")

    # find the title and strip the string
    name_dom = header.h1.get_text().encode("utf-8")
    name = str(name_dom)[2:-16]
    info.append(name)

    # find the year and strip the year
    year_dom = header.h1.span.get_text().encode("utf-8")
    year = str(year_dom)[3:-2]
    info.append(year)

    # find the duration and strip the string
    duration_dom = dom.find("time", itemprop="duration").get_text().encode("utf-8")
    duration = str(duration_dom)[28:-23]
    info.append(duration)

    # find all the genres and strip the string
    genre_dom = dom.find("div", itemprop="genre").a.get_text().encode("utf-8")
    genre = find_genres(genre_dom, dom)
    info.append(genre)

    # find all the directors and strip the string
    director_dom = dom.find("span", itemprop="director").get_text().encode("utf-8")
    director = find_directors(director_dom, dom)
    info.append(director)

    # find all the writers and strip the string
    writer_dom = dom.find("span", itemprop="creator").a.get_text().encode("utf-8")
    writer = find_writers(writer_dom, dom)
    info.append(writer)

    # find all the actors and strip the string
    actor_dom = dom.find("span", itemprop="actors").a.get_text().encode("utf-8")
    actor = find_actors(actor_dom, dom)
    info.append(actor)

    # find the rating and strip the string
    rating_dom = dom.find("span", itemprop="ratingValue").get_text().encode("utf-8")
    rating = str(rating_dom)[2:-1]
    info.append(rating)

    # find the number of ratings and strip the string
    number_ratings_dom = dom.find("span", itemprop="ratingCount").get_text().encode("utf-8")
    number_ratings = str(number_ratings_dom)[2:-1]
    info.append(number_ratings)

    return info

def find_genres(genre_dom, dom):
    """
    takes the first genre as input and looks if there are more find_genres.
    """
    # take the first genre and turn it into a string
    genre = str(genre_dom)[3:-1]

    # see if there are more genres to a movie
    next_genre = dom.find("div", itemprop="genre").a.find_next_sibling("a")

    # add the new genres to the string
    while(next_genre):
        temp = next_genre.get_text().encode("utf-8")
        genre = genre + "; " + "" + str(temp)[3:-1]
        next_genre = next_genre.find_next_sibling("a")
    return genre

def find_directors(director_dom, dom):
    """
    takes the first director as input and looks if there are more find_genres.
    """
    # take the first director and turn it into a string
    director = str(director_dom)[4:-2]

    # see if there are more directors to a movie
    next_director = dom.find("span", itemprop="director").find_next_sibling("span",
                             itemprop="director")

    # add all the directors to the string
    while(next_director):
        temp = next_director.get_text().encode("utf-8")
        director = director + "; " + str(temp)[4:-2]
        next_director = next_director.find_next_sibling("span", itemprop="director")
    return director

def find_writers(writer_dom, dom):
    """
    takes the first writer as input and looks if there are more find_genres.
    """
    # take the first writer and turn it into a string
    writer = str(writer_dom)[2:-1]

    # see if there are more writers
    next_writer = dom.find("span", itemprop="creator").find_next_sibling("span",
                           itemprop="creator")

    # add all the writers to the string
    while(next_writer):
        temp = next_writer.a.get_text().encode("utf-8")
        writer = writer + "; " + str(temp)[2:-1]
        next_writer = next_writer.find_next_sibling("span", itemprop="creator")
    return writer

def find_actors(actor_dom, dom):
    """
    takes the first actor as input and looks if there are more find_genres.
    """
    # take the first actor and turn it into a string
    actor = str(actor_dom)[2:-1]

    # see if there are more actors
    next_actor = dom.find("span", itemprop="actors").find_next_sibling("span",
                          itemprop="actors")

    # add all the actors to the string
    while(next_actor):
        temp = next_actor.a.get_text().encode("utf-8")
        actor = actor + "; " + str(temp)[2:-1]
        next_actor = next_actor.find_next_sibling("span", itemprop="actors")
    return actor

if __name__ == '__main__':
    main()  # call into the progam

    # If you want to test the functions you wrote, you can do that here:
    # ...
