import React, {useState, useEffect, Fragment} from 'react';
import {observer, inject} from "mobx-react";
import { f7, Popup, Page, Navbar, NavLeft, NavRight, NavTitle, Link, Input, Icon, List, ListItem, Actions, ActionsGroup, ActionsButton } from 'framework7-react';
import { useTranslation } from 'react-i18next';
import {Device} from '../../../utils/device';

// Add comment

const AddCommentPopup = inject("storeComments")(observer(props => {
    const { t } = useTranslation();
    const _t = t('Common.Collaboration', {returnObjects: true});
    useEffect(() => {
        f7.popup.open('.add-comment-popup');
    });
    const userInfo = props.userInfo;
    const [stateText, setText] = useState('');
    return (
        <Popup className="add-comment-popup">
            <Navbar>
                <NavLeft>
                    <Link onClick={() => {
                        props.storeComments.openAddComment(false);
                        f7.popup.close('.add-comment-popup');
                    }}>{_t.textCancel}</Link>
                </NavLeft>
                <NavTitle>{_t.textAddComment}</NavTitle>
                <NavRight>
                    <Link className={stateText.length === 0 && 'disabled'}
                          onClick={() => {
                              if (props.onAddNewComment(stateText, false)) {
                                  props.storeComments.openAddComment(false);
                                  f7.popup.close('.add-comment-popup');
                              }
                    }}>
                        {Device.android ? <Icon icon='icon-done-comment-white'/> : _t.textDone}
                    </Link>
                </NavRight>
            </Navbar>
            <div className='wrap-comment'>
                <div className="header-comment">
                    {Device.android &&
                    <div className='initials' style={{backgroundColor: `${userInfo.color}`}}>{userInfo.initials}</div>
                    }
                    <div className='name'>{userInfo.name}</div>
                </div>
                <div className='wrap-textarea'>
                    <Input type='textarea' placeholder={_t.textAddComment} autofocus value={stateText} onChange={(event) => {setText(event.target.value);}}></Input>
                </div>
            </div>
        </Popup>
    )
}));

const AddCommentDialog = inject("storeComments")(observer(props => {
    const { t } = useTranslation();
    const _t = t('Common.Collaboration', {returnObjects: true});
    const userInfo = props.userInfo;
    const templateInitials = `<div class="initials" style="background-color: ${userInfo.color};">${userInfo.initials}</div>`;
    useEffect(() => {
        f7.dialog.create({
            destroyOnClose: true,
            containerEl: document.getElementById('add-comment-dialog'),
            content:
                `<div class="navbar">
                    <div class="navbar-bg"></div>
                    <div class="navbar-inner sliding">
                        <div class="left">
                            <a href="#" id="comment-cancel">${_t.textCancel}</a>
                        </div>
                        <div class="title">${_t.textAddComment}</div>
                        <div class="right">
                            <a href="#" class="done" id="comment-done">${ Device.android ? '<i class="icon icon-done-comment-white"></i>' : _t.textDone}</a>
                        </div>
                    </div>
                </div>
                <div class='wrap-comment'>
                    <div class="header-comment">
                        ${Device.android ? templateInitials : ''}
                        <div class='name'>${userInfo.name}</div>
                    </div>
                    <div class='wrap-textarea'>
                        <textarea id='comment-text' placeholder='${_t.textAddComment}' autofocus></textarea>
                    </div>
                </div>`,
            on: {
                opened: () => {
                    const cancel = document.getElementById('comment-cancel');
                    cancel.addEventListener('click', () => {
                        f7.dialog.close();
                        props.storeComments.openAddComment(false);
                    });
                    const done = document.getElementById('comment-done');
                    done.addEventListener('click', () => {
                        const value = document.getElementById('comment-text').value;
                        if (value.length > 0 && props.onAddNewComment(value, false)) {
                            f7.dialog.close();
                            props.storeComments.openAddComment(false);
                        }
                    });
                    const area = document.getElementById('comment-text');
                    area.addEventListener('input', (event) => {
                        if (event.target.value.length === 0 && !done.classList.contains('disabled')) {
                            done.classList.add('disabled');
                        } else if (event.target.value.length > 0 && done.classList.contains('disabled')) {
                            done.classList.remove('disabled');
                        }
                    });
                    done.classList.add('disabled');
                }
            }
        }).open();
    });
    return (
        <div id='add-comment-dialog'></div>
    );
}));

const AddComment = props => {
    return (
        Device.phone ?
            <AddCommentPopup userInfo={props.userInfo} onAddNewComment={props.onAddNewComment} /> :
            <AddCommentDialog userInfo={props.userInfo} onAddNewComment={props.onAddNewComment} />
    )
};

// Actions
const CommentActions = ({comment, onCommentMenuClick, opened, openActionComment}) => {
    const { t } = useTranslation();
    const _t = t('Common.Collaboration', {returnObjects: true});
    return (
        <Actions id='comment-menu' opened={opened} onActionsClosed={() => openActionComment(false)}>
            <ActionsGroup>
                {comment && <Fragment>
                    {comment.editable && <ActionsButton onClick={() => {onCommentMenuClick('editComment', comment);}}>{_t.textEdit}</ActionsButton>}
                    {!comment.resolved ?
                        <ActionsButton onClick={() => {onCommentMenuClick('resolve', comment);}}>{_t.textResolve}</ActionsButton> :
                        <ActionsButton onClick={() => {onCommentMenuClick('resolve', comment);}}>{_t.textReopen}</ActionsButton>
                    }
                    <ActionsButton onClick={() => {onCommentMenuClick('addReply', comment);}}>{_t.textAddReply}</ActionsButton>
                    {comment.removable && <ActionsButton color='red' onClick={() => {onCommentMenuClick('deleteComment', comment);}}>{_t.textDeleteComment}</ActionsButton>}
                </Fragment>
                }
            </ActionsGroup>
            <ActionsGroup>
                <ActionsButton>{_t.textCancel}</ActionsButton>
            </ActionsGroup>
        </Actions>
    )
};

// Edit comment
const EditCommentPopup = inject("storeComments")(observer(({storeComments, comment, onEditComment}) => {
    const { t } = useTranslation();
    const _t = t('Common.Collaboration', {returnObjects: true});
    useEffect(() => {
        f7.popup.open('.edit-comment-popup');
    });
    const [stateText, setText] = useState(comment.comment);
    return (
        <Popup className="edit-comment-popup">
            <Navbar>
                <NavLeft>
                    <Link onClick={() => {
                        f7.popup.close('.edit-comment-popup');
                        storeComments.openEditComment(false);
                    }}>{_t.textCancel}</Link>
                </NavLeft>
                <NavTitle>{_t.textEditComment}</NavTitle>
                <NavRight>
                    <Link className={stateText.length === 0 && 'disabled'}
                          onClick={() => {
                              onEditComment(comment, stateText);
                              f7.popup.close('.edit-comment-popup');
                              storeComments.openEditComment(false);
                          }}
                    >
                        {Device.android ? <Icon icon='icon-done-comment-white'/> : _t.textDone}
                    </Link>
                </NavRight>
            </Navbar>
            <div className='wrap-comment'>
                <div className="comment-header">
                    {Device.android &&
                    <div className='initials' style={{backgroundColor: `${comment.userColor}`}}>{comment.userInitials}</div>
                    }
                    <div>
                        <div className='name'>{comment.userName}</div>
                        <div className='comment-date'>{comment.date}</div>
                    </div>
                </div>
                <div className='wrap-textarea'>
                    <Input type='textarea' placeholder={_t.textEditComment} autofocus value={stateText} onChange={(event) => {setText(event.target.value);}}></Input>
                </div>
            </div>
        </Popup>
    )
}));

const EditCommentDialog = inject("storeComments")(observer(({storeComments, comment, onEditComment}) => {
    const { t } = useTranslation();
    const _t = t('Common.Collaboration', {returnObjects: true});
    const templateInitials = `<div class="initials" style="background-color: ${comment.userColor};">${comment.userInitials}</div>`;
    useEffect(() => {
        f7.dialog.create({
            destroyOnClose: true,
            containerEl: document.getElementById('edit-comment-dialog'),
            content:
                `<div class="navbar">
                    <div class="navbar-bg"></div>
                    <div class="navbar-inner sliding">
                        <div class="left">
                            <a href="#" id="comment-cancel">${_t.textCancel}</a>
                        </div>
                        <div class="title">${_t.textEditComment}</div>
                        <div class="right">
                            <a href="#" class="done" id="comment-done">${ Device.android ? '<i class="icon icon-done-comment-white"></i>' : _t.textDone}</a>
                        </div>
                    </div>
                </div>
                <div class='wrap-comment'>
                    <div class="header-comment">
                        ${Device.android ? templateInitials : ''}
                        <div>
                            <div class='name'>${comment.userName}</div>
                            <div class='comment-date'>${comment.date}</div>
                        </div>
                    </div>
                    <div class='wrap-textarea'>
                        <textarea id='comment-text' placeholder='${_t.textEditComment}' autofocus>${comment.comment}</textarea>
                    </div>
                </div>`,
            on: {
                opened: () => {
                    const cancel = document.getElementById('comment-cancel');
                    cancel.addEventListener('click', () => {
                        f7.dialog.close();
                        storeComments.openEditComment(false);
                    });
                    const done = document.getElementById('comment-done');
                    done.addEventListener('click', () => {
                        const value = document.getElementById('comment-text').value;
                        if (value.length > 0) {
                            onEditComment(comment, value);
                            f7.dialog.close();
                            storeComments.openEditComment(false);
                        }
                    });
                    const area = document.getElementById('comment-text');
                    area.addEventListener('input', (event) => {
                        if (event.target.value.length === 0 && !done.classList.contains('disabled')) {
                            done.classList.add('disabled');
                        } else if (event.target.value.length > 0 && done.classList.contains('disabled')) {
                            done.classList.remove('disabled');
                        }
                    });
                    done.classList.add('disabled');
                }
            }
        }).open();
    });
    return (
        <div id='edit-comment-dialog'></div>
    );
}));

const EditComment = ({comment, onEditComment}) => {
    return (
        Device.phone ?
            <EditCommentPopup comment={comment} onEditComment={onEditComment}/> :
            <EditCommentDialog comment={comment} onEditComment={onEditComment}/>
    )
};

const AddReplyPopup = inject("storeComments")(observer(({storeComments, userInfo, comment, onAddReply}) => {
    const { t } = useTranslation();
    const _t = t('Common.Collaboration', {returnObjects: true});
    useEffect(() => {
        f7.popup.open('.add-reply-popup');
    });
    const [stateText, setText] = useState('');
    return (
        <Popup className="add-reply-popup">
            <Navbar>
                <NavLeft>
                    <Link onClick={() => {
                        storeComments.openAddReply(false);
                        f7.popup.close('.add-reply-popup');
                    }}>{_t.textCancel}</Link>
                </NavLeft>
                <NavTitle>{_t.textAddReply}</NavTitle>
                <NavRight>
                    <Link className={stateText.length === 0 && 'disabled'}
                          onClick={() => {
                              onAddReply(comment, stateText);
                              storeComments.openAddReply(false);
                              f7.popup.close('.add-reply-popup');
                          }}>
                        {Device.android ? <Icon icon='icon-done-comment-white'/> : _t.textDone}
                    </Link>
                </NavRight>
            </Navbar>
            <div className='wrap-comment'>
                <div className="header-comment">
                    {Device.android &&
                    <div className='initials' style={{backgroundColor: `${userInfo.color}`}}>{userInfo.initials}</div>
                    }
                    <div className='name'>{userInfo.name}</div>
                </div>
                <div className='wrap-textarea'>
                    <Input type='textarea' placeholder={_t.textAddReply} autofocus value={stateText} onChange={(event) => {setText(event.target.value);}}></Input>
                </div>
            </div>
        </Popup>
    )
}));

const AddReplyDialog = inject("storeComments")(observer(({storeComments, userInfo, comment, onAddReply}) => {
    const { t } = useTranslation();
    const _t = t('Common.Collaboration', {returnObjects: true});
    const templateInitials = `<div class="initials" style="background-color: ${userInfo.color};">${userInfo.initials}</div>`;
    useEffect(() => {
        f7.dialog.create({
            destroyOnClose: true,
            containerEl: document.getElementById('add-reply-dialog'),
            content:
                `<div class="navbar">
                    <div class="navbar-bg"></div>
                    <div class="navbar-inner sliding">
                        <div class="left">
                            <a href="#" id="reply-cancel">${_t.textCancel}</a>
                        </div>
                        <div class="title">${_t.textAddReply}</div>
                        <div class="right">
                            <a href="#" class="done" id="reply-done">${ Device.android ? '<i class="icon icon-done-comment-white"></i>' : _t.textDone}</a>
                        </div>
                    </div>
                </div>
                <div class='wrap-comment'>
                    <div class="header-comment">
                        ${Device.android ? templateInitials : ''}
                        <div class='name'>${userInfo.name}</div>
                    </div>
                    <div class='wrap-textarea'>
                        <textarea id='reply-text' placeholder='${_t.textAddReply}' autofocus></textarea>
                    </div>
                </div>`,
            on: {
                opened: () => {
                    const cancel = document.getElementById('reply-cancel');
                    cancel.addEventListener('click', () => {
                        f7.dialog.close();
                        storeComments.openAddReply(false);
                    });
                    const done = document.getElementById('reply-done');
                    done.addEventListener('click', () => {
                        const value = document.getElementById('reply-text').value;
                        if (value.length > 0) {
                            onAddReply(comment, value);
                            f7.dialog.close();
                            storeComments.openAddReply(false);
                        }
                    });
                    const area = document.getElementById('reply-text');
                    area.addEventListener('input', (event) => {
                        if (event.target.value.length === 0 && !done.classList.contains('disabled')) {
                            done.classList.add('disabled');
                        } else if (event.target.value.length > 0 && done.classList.contains('disabled')) {
                            done.classList.remove('disabled');
                        }
                    });
                    done.classList.add('disabled');
                }
            }
        }).open();
    });
    return (
        <div id='add-reply-dialog'></div>
    );
}));

const AddReply = ({userInfo, comment, onAddReply}) => {
    return (
        Device.phone ?
            <AddReplyPopup userInfo={userInfo} comment={comment} onAddReply={onAddReply}/> :
            <AddReplyDialog userInfo={userInfo} comment={comment} onAddReply={onAddReply}/>
    )
};

// View comments
const ViewComments = ({storeComments, storeAppOptions, onCommentMenuClick, onResolveComment}) => {
    const { t } = useTranslation();
    const _t = t('Common.Collaboration', {returnObjects: true});
    const isAndroid = Device.android;

    const viewMode = !storeAppOptions.canComments;
    const comments = storeComments.sortComments;
    const sliceQuote = (text) => {
        if (text) {
            let sliced = text.slice(0, 100);
            if (sliced.length < text.length) {
                sliced += '...';
                return sliced;
            }
            return text;
        }
    };

    const [clickComment, setClickComment] = useState();
    const [commentActionsOpened, openActionComment] = useState(false);

    return (
        <Page>
            <Navbar title={_t.textComments} backLink={_t.textBack}/>
            {!comments ?
                <div className='no-comments'>{_t.textNoComments}</div> :
                <List className='comment-list'>
                    {comments.map((comment, indexComment) => {
                        return (
                            <ListItem key={`comment-${indexComment}`}>
                                <div slot='header' className='comment-header'>
                                    <div className='left'>
                                        {isAndroid && <div className='initials' style={{backgroundColor: `${comment.userColor ? comment.userColor : '#cfcfcf'}`}}>{comment.userInitials}</div>}
                                        <div>
                                            <div className='user-name'>{comment.userName}</div>
                                            <div className='comment-date'>{comment.date}</div>
                                        </div>
                                    </div>
                                    {!viewMode &&
                                        <div className='right'>
                                            <div className='comment-resolve' onClick={() => {onResolveComment(comment);}}><Icon icon={comment.resolved ? 'icon-resolve-comment check' : 'icon-resolve-comment'} /></div>
                                            <div className='comment-menu'
                                                 onClick={() => {setClickComment(comment); openActionComment(true);}}
                                            ><Icon icon='icon-menu-comment'/></div>
                                        </div>
                                    }
                                </div>
                                <div slot='footer'>
                                    {comment.quote && <div className='comment-quote'>{sliceQuote(comment.quote)}</div>}
                                    <div className='comment-text'><pre>{comment.comment}</pre></div>
                                    {comment.replies.length > 0 &&
                                    <ul className='list-reply'>
                                        {comment.replies.map((reply, indexReply) => {
                                            return (
                                                <li key={`reply-${indexComment}-${indexReply}`}
                                                    className='reply-item'
                                                >
                                                    <div className='item-content'>
                                                        <div className='item-inner'>
                                                            <div className='item-title'>
                                                                <div slot='header' className='reply-header'>
                                                                    <div className='left'>
                                                                        {isAndroid && <div className='initials' style={{backgroundColor: `${reply.userColor ? reply.userColor : '#cfcfcf'}`}}>{reply.userInitials}</div>}
                                                                        <div>
                                                                            <div className='user-name'>{reply.userName}</div>
                                                                            <div className='reply-date'>{reply.date}</div>
                                                                        </div>
                                                                    </div>
                                                                    {!viewMode &&
                                                                        <div className='right'>
                                                                            <div className='reply-menu'><Icon icon='icon-menu-comment'/></div>
                                                                        </div>
                                                                    }
                                                                </div>
                                                                <div slot='footer'>
                                                                    <div className='reply-text'><pre>{reply.reply}</pre></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                    }
                                </div>
                            </ListItem>
                        )
                    })}
                </List>
            }

            <CommentActions comment={clickComment} onCommentMenuClick={onCommentMenuClick} opened={commentActionsOpened} openActionComment={openActionComment}/>
        </Page>
    )
};

const _ViewComments = inject('storeComments', 'storeAppOptions')(observer(ViewComments));

export {
    AddComment,
    EditComment,
    AddReply,
    _ViewComments as ViewComments
}
