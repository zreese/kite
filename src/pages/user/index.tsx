import { ProfileViewDetailed } from 'atproto/packages/api/src/client/types/app/bsky/actor/defs';
import cn from 'classnames';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import Markdown from 'markdown-to-jsx';
import { SyntheticEvent, useEffect, useState } from 'react';
import { Portal } from 'react-portal';
import { useMutation, useQuery } from "react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import agent from "../../Agent";
import AvatarPlaceholder from '../../assets/placeholder.png';
import BackButton from "../../components/BackButton";
import Blue from '../../components/Blue/Blue';
import Button from "../../components/Button";
import Layout from "../../components/Layout";
import Lightbox from '../../components/Lightbox';
import Loading from "../../components/Loading";
import PostsRenderer from '../../components/PostsRenderer';
import { lightboxAtom } from '../../store/lightbox';
import { userAtom } from '../../store/user';
import renderMarkdown from "../../utils/renderMarkdown";
import Blocks from './Blocks';
import Likes from './Likes';
import Posts from './Posts';
import styles from './User.module.scss';

export default function User(props: {}) {
    const params = useParams();
    const { did } = params;
    const location = useLocation();
    const pathname = location.pathname;
    const tabFromUrl = pathname.split('/')[pathname.split('/').length - 1];
    const me = useAtomValue(userAtom);
    const [lightbox, setLightbox] = useAtom<any>(lightboxAtom);
    const { data, isLoading } = useQuery(["user", did], () => agent.getProfile({
        actor: did!
    }), {
        onSuccess: d => {
            setUser(d.data);
        },
        onError: error => {
            console.error(error);
        }
    });
    const [user, setUser] = useState<ProfileViewDetailed | any>(data?.data! || null);
    const [tab, setTab] = useState<'posts' | 'likes'>();


    const { mutate: followMutate, isLoading: followLoading } = useMutation(() => agent.follow(user?.did!), {
        onSuccess: d => {
            setUser((prev: any) => ({ ...prev, viewer: { ...prev?.viewer, following: d.uri } }));
        }
    });
    const { mutate: unfollowMutate, isLoading: unfollowLoading } = useMutation(() => agent.deleteFollow(user?.viewer?.following!), {
        onSuccess: d => {
            setUser((prev: any) => ({ ...prev, viewer: { ...prev?.viewer, following: false } }));
        }
    });

    const _handleFollow = (e: SyntheticEvent) => {
        e.preventDefault();

        followMutate(user?.did!);
    };

    const _handleUnfollow = (e: SyntheticEvent) => {
        e.preventDefault();

        unfollowMutate(user?.did!);
    }

    useEffect(() => {
        return () => {
            setUser(null);
        }
    }, []);



    return (
        <>
            <Layout key={user?.did}>
                <div className="back-button-wrapper">
                    <BackButton />
                </div>
                {isLoading || !user ? <div className="d-flex align-items-center justify-content-center p-5"><Loading isColored /></div> :
                    <>
                        <div className={styles.header}>
                            {user.banner ? <div className={styles.cover} onClick={() =>
                                // @ts-ignore
                                setLightbox(() => ({ show: true, images: [user.banner] }))}>
                                <img src={user?.banner} />
                            </div> : ''}
                            <div className={cn(styles.info, { [styles.noCover]: !user?.banner })}>
                                <div className={styles.avatar} onClick={() =>
                                    // @ts-ignore
                                    setLightbox(() => ({ show: true, images: [user?.avatar] }))}>
                                    <img src={user?.avatar || AvatarPlaceholder} alt={user?.displayName} />
                                </div>
                                {user.did == me?.did ? '' : <div className={styles.infoRight}>
                                    {user?.viewer?.following ? <Button className="btn" text="Unfollow" loading={unfollowLoading} loadingColored onClick={_handleUnfollow} /> : <Button className="btn primary" text="Follow" loading={followLoading} onClick={_handleFollow} />}
                                </div>}
                            </div>
                            <div>
                                <div className={cn("d-flex align-items-center", styles.nameWrapper)}>
                                    <h1>{user?.displayName}</h1>
                                    {user?.viewer?.followedBy ? <span className="tag">Follows You</span> : ''}
                                </div>
                                <span className="text-grey">@{user?.handle}</span>
                                <p dir="auto"><Markdown>{renderMarkdown(user?.description?.replace(/\n/g, ' <br/> ') || '')}</Markdown></p>
                                <div className={styles.followStats}>
                                    <p>
                                        <strong>{user?.followersCount}</strong>
                                        <span>Followers</span>
                                    </p>
                                    <p>
                                        <strong>{user?.followsCount}</strong>
                                        <span>Followings</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.tabs}>
                            <Link to={`/user/${did}/posts`} title="" target="_self" className={cn(styles.tab, { [styles.active]: tabFromUrl == 'posts' || tabFromUrl == did })}>Posts</Link>
                            <Link to={`/user/${did}/likes`} title="" target="_self" className={cn(styles.tab, { [styles.active]: tabFromUrl == 'likes' })}>Likes</Link>
                            <Link to={`/user/${did}/blocks`} title="" target="_self" className={cn(styles.tab, { [styles.active]: tabFromUrl == 'blocks' })}>Blocks</Link>
                        </div>
                        <div className={styles.posts}>
                            {{ posts: <Posts />, likes: <Likes />, blocks: <Blocks />, [did as string]: <Posts /> }[tabFromUrl]}
                        </div>
                    </>
                }
            </Layout>
            {lightbox.show ? <Portal>
                <Lightbox />
            </Portal> : ''}
        </>
    );
}