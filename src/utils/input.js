/**
 * Get caret position of an input
 *
 * @param {object} element
 */
export function getCaretPosition( element ) {
  let caretPosition = null;
  const document = element.ownerDocument || element.document;
  const window = document.defaultView || document.parentWindow;
  let selection;

  if ( typeof window.getSelection != 'undefined' ) {
    selection = window.getSelection();

    if ( selection.rangeCount > 0 ) {
      caretPosition = window.getSelection().getRangeAt(0);
    }
  } else if ( ( selection = document.selection ) && selection.type != 'Control' ) {
    caretPosition = selection.createRange();
  }

  return caretPosition;
}

/**
 * Insert HTML on input
 *
 * @param {object} element
 * @param {object} caretPosition
 * @param {string} html
 */
export function insertHTML( element, caretPosition, html ) {
  const document = element.ownerDocument || element.document;
  const window = document.defaultView || document.parentWindow;
  let selection;

  if ( caretPosition ) {
    if ( typeof window.getSelection != 'undefined' ) {
      selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(caretPosition);
    } else if ( ( selection = document.selection ) && selection.type != 'Control' ) {
      caretPosition.select();
    }
  }

  element.focus();

  if ( typeof window.getSelection != 'undefined' ) {
    selection = window.getSelection();

    if ( selection.getRangeAt && selection.rangeCount ) {
      let range = selection.getRangeAt(0);
      range.deleteContents();

      const el = document.createElement('div');
      el.innerHTML = html;

      const fragment = document.createDocumentFragment();
      let node;
      let lastNode;
      while ( ( node = el.firstChild ) ) {
        lastNode = fragment.appendChild(node);
      }

      range.insertNode(fragment);

      if ( lastNode ) {
        range = range.cloneRange();
        range.setStartAfter(lastNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      return selection.getRangeAt(0);
    }
  } else if ( ( selection = document.selection ) && selection.type != 'Control' ) {
    const range = document.selection.createRange();
    range.pasteHTML(html);
    range.select();

    return document.selection.createRange();
  }
}

/**
 * Get autocomplete text query
 *
 * @param {object} element
 */
export function getAutoCompleteTextQuery( element ) {
  let parentElement = null;

  if ( window.getSelection ) {
    parentElement = window.getSelection().anchorNode.parentNode;
  } else if ( document.selection && document.selection.createRange ) {
    parentElement = document.selection.createRange().parentElement();
  }

  if ( parentElement && ! parentElement.classList.contains( 'user-username-tag' ) ) {
    const caretPosition = getCaretPosition( element );

    if ( caretPosition ) {
      const caretWords = caretPosition.commonAncestorContainer.data;
      const offset = caretPosition.startOffset;
      const start = /@/ig;
      const word = /@(\w+)/ig;

      if ( caretWords ) {
        const leftCaretText = caretWords.substring(0, offset);
        const rightCaretText = caretWords.substring(offset);
        const leftCaretWords = leftCaretText.split(' ');
        const leftCaretWordsLength = leftCaretWords.length;
        const leftCaretLastWord = leftCaretWords[ leftCaretWordsLength - 1 ];
        const rightCaretWords = rightCaretText.split(' ');
        const rightCaretFirstWord = rightCaretWords[0];

        const selectedWord = leftCaretLastWord + rightCaretFirstWord;

        const go = selectedWord.match( start );
        const name = selectedWord.match( word );

        if ( go !== null && go.length > 0 && name !== null && name.length > 0 ) {
          const textQuery = name[0].substr(1);

          return textQuery;
        }
      }
    }
  }

  return '';
}

/**
 * Insert autocomplete text
 *
 * @param {object} element
 * @param {object} caretPosition
 * @param {string} html
 */
export function insertAutocompleteHTML( element, caretPosition, html ) {
  const document = element.ownerDocument || element.document;
  const window = document.defaultView || document.parentWindow;
  let selection;

  if ( caretPosition ) {
    if ( typeof window.getSelection != 'undefined' ) {
      selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(caretPosition);
    } else if ( ( selection = document.selection ) && selection.type != 'Control' ) {
      caretPosition.select();
    }
  }

  element.focus();

  if ( typeof window.getSelection != 'undefined' ) {
    selection = window.getSelection();

    if ( selection.getRangeAt && selection.rangeCount ) {
      let range = selection.getRangeAt(0);

      if ( caretPosition ) {
        const caretWords = range.commonAncestorContainer.data;
        const offset = range.startOffset;
        const start = /@/ig;
        const word = /@(\w+)/ig;

        if ( caretWords ) {
          const leftCaretText = caretWords.substring(0, offset);
          const rightCaretText = caretWords.substring(offset);
          const leftCaretWords = leftCaretText.split(' ');
          const leftCaretWordsLength = leftCaretWords.length;
          const leftCaretLastWord = leftCaretWords[ leftCaretWordsLength - 1 ];
          const rightCaretWords = rightCaretText.split(' ');
          const rightCaretFirstWord = rightCaretWords[0];

          const selectedWord = leftCaretLastWord + rightCaretFirstWord;

          const go = selectedWord.match( start );
          const name = selectedWord.match( word );

          if ( go !== null && go.length > 0 && name !== null && name.length > 0 ) {
            const textQuery = name[0];

            const textFirstLetterIndex = caretWords.indexOf(textQuery);
            const textLastLetterIndex = textFirstLetterIndex + textQuery.length;

            range.setStart(range.endContainer, textFirstLetterIndex);
            range.setEnd(range.endContainer, textLastLetterIndex);
            range.deleteContents();

            const el = document.createElement('div');
            el.innerHTML = `&nbsp;${html}&nbsp;`;

            const fragment = document.createDocumentFragment();
            let node;
            let lastNode;
            while ( ( node = el.firstChild ) ) {
              lastNode = fragment.appendChild(node);
            }

            range.insertNode(fragment);

            if ( lastNode ) {
              range = range.cloneRange();
              range.setStartAfter(lastNode);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }

            return selection.getRangeAt(0);
          }
        }
      }
    }
  } else if ( ( selection = document.selection ) && selection.type != 'Control' ) {
    const range = document.selection.createRange();
    range.pasteHTML(html);
    range.select();

    return document.selection.createRange();
  }
}

/**
 * Remove autocomplete text
 *
 */
export function removeAutocompleteHTML() {
  let parentElement = null;

  if ( window.getSelection ) {
    parentElement = window.getSelection().anchorNode.parentNode;
  } else if ( document.selection && document.selection.createRange ) {
    parentElement = document.selection.createRange().parentElement();
  }

  if ( parentElement && parentElement.classList.contains( 'user-username-tag' ) ) {
    parentElement.outerHTML = parentElement.innerHTML;
  }
}
